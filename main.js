// ============================================================================
// CONFIGURAÇÃO GLOBAL E INICIALIZAÇÃO DO ENGINE
// ============================================================================

// Definição de constantes de tela para facilitar a manutenção e escalabilidade do projeto
var largGame = 1366; 
var altGame = 768;   

var config = {
    type: Phaser.AUTO,  
    width: largGame,    
    height: altGame,    

    physics: {
        // Implementação do motor Arcade, escolhido pela excelente relação performance/custo computacional
        default: 'arcade',
        arcade: {
            gravity: { y: 600 },  // Valor de gravidade balanceado para um "feeling" de plataforma ágil
            debug: false           // Modo debug ativado para validação de hitboxes em tempo de desenvolvimento
        }
    },

    // Ordem das cenas: a IntroScene precede a lógica principal para preparar o jogador
    scene: [IntroScene, { key: 'GameScene', preload: preload, create: create, update: update }]
};

var game = new Phaser.Game(config);

// ============================================================================
// VARIÁVEIS DE ESTADO E PERSISTÊNCIA DE DADOS
// ============================================================================

var life = 5; 
var protagonist;   
var protaState;    

// Input Management: centralização das entradas para evitar latência de resposta
var teclado;       
var keyX;          
var keyC;          

// Flags de Controle: essenciais para o sistema de "Animação Prioritária"
// Impedem que comandos conflitantes quebrem o fluxo visual do sprite
var isAttacking = false; 
var isDashing = false;   

var platforms;     

// Score System e UI
var coins;         
var coinCount = 0; 
var coinText;      

// ============================================================================
// SISTEMA DINÂMICO DE CONQUISTAS (Game Design)
// ============================================================================
// Estrutura de dados em Array de Objetos para facilitar a expansão do sistema de metas
var achievements = [
    { coins: 5, message: '🎯 5 Moedas coletadas!' },
    { coins: 10, message: '⭐ 10 Moedas! Você está indo bem!' },
    { coins: 20, message: '🔥 20 Moedas! Que dedicação!' },
    { coins: 50, message: '👑 50 Moedas! Quase um mestre!' },
    { coins: 100, message: '💎 100 Moedas! VOCÊ É LENDÁRIO!' }
];

var achievementText;     
var achievementUnlocked = {}; // Hash map para busca O(1) de conquistas já liberadas

// ============================================================================
// ETAPA 1: PRELOAD (Carregamento de Assets)
// ============================================================================
function preload() {
    // Uso de Spritesheets para otimização de Atlas Textures e gerenciamento de frames
    this.load.spritesheet('prota', 'assets/sprites/protaIdle.png', { frameWidth: 128, frameHeight: 80 });
    this.load.spritesheet('protaMov', 'assets/sprites/protaRun.png', { frameWidth: 128, frameHeight: 80 });
    this.load.spritesheet('protaAttack', 'assets/sprites/protaCombo1.png', { frameWidth: 128, frameHeight: 80 });
    this.load.spritesheet('protaJump', 'assets/sprites/protaJump.png', { frameWidth: 128, frameHeight: 60 });
    this.load.spritesheet('protaDash', 'assets/sprites/protaDash.png', { frameWidth: 128, frameHeight: 80 });
    this.load.spritesheet('coin', 'assets/sprites/coinSheet.png', { frameWidth: 20, frameHeight: 20 });
    
    // Assets estáticos de cenário e plataformas
    this.load.image('platform', 'assets/sprites/tijolos.png');
    this.load.image('platform2', 'assets/sprites/tijolos.png');
    this.load.image('platform3', 'assets/sprites/tijolos.png');
    this.load.image('background', 'assets/backgrounds/bg_noPhysic.png');
}

// ============================================================================
// ETAPA 2: CREATE (Instanciação e Configuração de Objetos)
// ============================================================================
function create() {
    // 1. Renderização do cenário (Background Parallax ou Estático)
    this.add.image(largGame / 2, altGame / 2, 'background').setScale(3);
    
    // 2. Setup do Player e refinamento de Física
    protagonist = this.physics.add.sprite(100, 628, 'prota').setScale(2.5);
    protagonist.setCollideWorldBounds(true);
    
    // Refinamento de Hitbox: crucial para que o personagem não pareça "flutuar" nas bordas
    protagonist.body.setSize(30, 60);     
    protagonist.body.setOffset(49, 20);   
    protagonist.body.setBounce(0.1);

    // 3. Criação de Plataformas Estáticas (Static Group seria uma alternativa para larga escala)
    plataforma = this.physics.add.staticImage(700, 700, 'platform');
    plataforma_2 = this.physics.add.staticImage(400, 550, 'platform2');
    plataforma_3 = this.physics.add.staticImage(1059, 550, 'platform3');

    // 4. Registro de Animações no Global Manager
    // Definição de frameRates específicos para cada intenção de movimento
    this.anims.create({
        key: 'idleProta',
        frames: this.anims.generateFrameNumbers('prota', { start: 0, end: 9 }),
        frameRate: 10,
        repeat: -1
    });

    this.anims.create({
        key: 'movProta',
        frames: this.anims.generateFrameNumbers('protaMov', { start: 0, end: 8 }),
        frameRate: 15,
        repeat: -1
    });

    // Animações com repeat: 0 para garantir a execução única por comando
    this.anims.create({ key: 'attackProta', frames: this.anims.generateFrameNumbers('protaAttack', { start: 0, end: 2 }), frameRate: 15, repeat: 0 });
    this.anims.create({ key: 'jumpProta', frames: this.anims.generateFrameNumbers('protaJump', { start: 0, end: 5 }), frameRate: 4.5, repeat: 0 });
    this.anims.create({ key: 'dashProta', frames: this.anims.generateFrameNumbers('protaDash', { start: 0, end: 5 }), frameRate: 10, repeat: 0 });
    this.anims.create({ key: 'spin', frames: this.anims.generateFrameNumbers('coin', { start: 0, end: 7 }), frameRate: 10, repeat: -1 });

    // 5. Mapeamento de Input
    teclado = this.input.keyboard.createCursorKeys();
    this.keyX = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.X);
    this.keyC = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.C);

    // 6. Grupo de Objetos Coletáveis
    coins = this.physics.add.group();
    coinText = this.add.text(16, 16, 'Moedas: 0', { fontSize: '32px', fill: '#fff' });

    // 7. UI de Achievement (Invisível por padrão)
    achievementText = this.add.text(largGame / 2, altGame / 2 - 100, '', {
        fontSize: '24px', fill: '#FFD700', align: 'center', backgroundColor: '#000000', padding: { x: 20, y: 10 }
    });
    achievementText.setOrigin(0.5).setVisible(false);

    // 8. Colisores e Regras de Sobreposição (Overlap)
    // Separação entre colisão física (plataformas) e detecção lógica (moedas)
    this.physics.add.overlap(protagonist, coins, (p, c) => collectCoin(p, c, this), null, this);
    this.physics.add.collider(protagonist, [plataforma, plataforma_2, plataforma_3]);
    this.physics.add.collider(coins, [plataforma, plataforma_2, plataforma_3]);

    // 9. Ciclo de Spawning via Timer
    this.time.addEvent({ delay: 2000, callback: spawnCoin, callbackScope: this, loop: true });
    
    // 10. Event-Driven Programming: Listener para reset de estados de ação
    protagonist.on('animationcomplete', function (anim) {
        if (anim.key === 'attackProta') isAttacking = false;
        if (anim.key === 'dashProta') {
            isDashing = false;
            protagonist.setVelocityX(0); 
        }
    });
}

// ============================================================================
// ETAPA 3: UPDATE (Loop Principal de Lógica)
// ============================================================================
function update() {
    // Bloqueio de controle: Prioriza a animação de ação sobre o movimento básico
    if (isAttacking || isDashing) return;

    // Detecção de solo multi-fatorial para evitar o bug de pulo infinito
    var noChao = protagonist.body.blocked.down || protagonist.body.touching.down || protagonist.y >= 627;

    // Lógica do Dash (Mecânica de esquiva/velocidade)
    if (Phaser.Input.Keyboard.JustDown(this.keyC)) {
        isDashing = true;
        var direcao = protagonist.flipX ? -1 : 1;
        protagonist.setVelocityX(600 * direcao);
        protagonist.anims.play('dashProta', true);
        return;
    }

    // Movimentação Lateral com inversão de Sprite (Flip)
    if (teclado.left.isDown) {
        protagonist.setVelocityX(-300);
        protagonist.setFlip(true, false);
    } else if (teclado.right.isDown) {
        protagonist.setVelocityX(300);
        protagonist.setFlip(false, false);
    } else {
        protagonist.setVelocityX(0);
    }

    // Lógica de Pulo
    if (teclado.up.isDown && noChao) {
        protagonist.setVelocityY(-450);
    }

    // State Machine de Animações Básicas
    if (!noChao) {
        protagonist.anims.play('jumpProta', true);
    } else if (protagonist.body.velocity.x !== 0) {
        protagonist.anims.play('movProta', true);
    } else {
        protagonist.anims.play('idleProta', true);
    }

    // Execução de Ataque
    if (Phaser.Input.Keyboard.JustDown(this.keyX)) {
        isAttacking = true;
        protagonist.setVelocityX(0);
        protagonist.anims.play('attackProta', true);
    }
}

// ============================================================================
// FUNÇÕES AUXILIARES E MÉTODOS DE GAMEPLAY
// ============================================================================

// Instanciação de moedas com física e hitbox otimizada
function spawnCoin() {
    var x = Phaser.Math.Between(50, largGame - 50);
    var y = Phaser.Math.Between(50, altGame - 150);
    var coin = coins.create(x, y, 'coin');
    
    coin.setScale(2);
    if (coin.body) {
        coin.body.setAllowGravity(true);
        coin.body.setCollideWorldBounds(true);
        coin.body.setBounce(0.3);
        
        // Customização da Hitbox Circular: melhora a precisão da coleta
        var radius = Math.max(6, Math.floor(Math.min(coin.displayWidth, coin.displayHeight) / 4));
        var offsetX = Math.floor(coin.displayWidth / 2) - radius;
        var offsetY = Math.floor(coin.displayHeight / 2) - radius;
        coin.body.setCircle(radius, offsetX, offsetY);
    }
    coin.anims.play('spin', true);
}

// Handler de Coleta: Gerencia a destruição do objeto e atualização da UI
function collectCoin(prota, coin, scene) {
    coin.destroy(); // Garbage collection manual para evitar vazamento de memória física
    coinCount++;
    if (coinText) coinText.setText('Moedas: ' + coinCount);
    checkAchievements(scene);
}

// Sistema de Feedback Visual (Achievements) com uso de Tweens para interpolação de Alpha
function checkAchievements(scene) {
    for (var i = 0; i < achievements.length; i++) {
        var achievement = achievements[i];
        
        if (coinCount === achievement.coins && !achievementUnlocked[achievement.coins]) {
            achievementUnlocked[achievement.coins] = true;
            
            if (achievementText && scene) {
                achievementText.setText(achievement.message).setVisible(true);
                
                // Tween: Animação procedural para um desaparecimento suave
                scene.tweens.add({
                    targets: achievementText,
                    alpha: 0,
                    duration: 3000,
                    delay: 1000,
                    onComplete: () => {
                        achievementText.setVisible(false).setAlpha(1);
                    }
                });
            }
            break; 
        }
    }
}