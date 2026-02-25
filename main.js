var config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,

    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 600 },
            debug: false
        }
    },

    scene: {
        preload: preload,
        create: create,
        update: update
    }
};

var game = new Phaser.Game(config);

var life = 5; //Var de vida do personagem
var samurai; //Var objeto do personagem
var samState = false; //Var de estado andando do personagem
var teclado; //Var do obj teclado
var isAttacking = false; //Var se ele está atacando
var keyX; //Var tecla X teclado

function preload() {
    //Loading spritesheet do Idle do personagem
    this.load.spritesheet('prota', 'assets/sprites/IDLE.png', { frameWidth: 96, frameHeight: 96 });
    //Loading spritesheet corrida do personagem
    this.load.spritesheet('protaMov', 'assets/sprites/RUN.png', { frameWidth: 96, frameHeight: 96});
    //Loading spritesheet ataque do personagem
    this.load.spritesheet('protaAttack', 'assets/sprites/ATTACK.png', { frameWidth: 96, frameHeight: 96});
}

function create() {
    //Dando física ao protagonista e o adicionando a tela
    samurai = this.physics.add.sprite(100, 40, 'prota').setScale(3);
    //Fazendo ele colidir com a borda da tela
    samurai.setCollideWorldBounds(true);

    //Criando a animação de Idle
    this.anims.create({
        key: 'idleSam',
        frames: this.anims.generateFrameNumbers('prota', { start: 0, end: 9 }),
        frameRate: 10,
        repeat: -1
    });

    //Criando a animação de corrida
    this.anims.create({
        key: 'movSam',
        frames: this.anims.generateFrameNumbers('protaMov', { start: 0, end: 15 }),
        frameRate: 15,
        repeat: -1
    });

    //Criando a animação de ataque
    this.anims.create({
        key: 'attackSam',
        frames: this.anims.generateFrameNumbers('protaAttack', { start: 0, end: 5 }),
        frameRate: 10,
        repeat: 0
    });

    //Definindo as setas para a variável teclado
    teclado = this.input.keyboard.createCursorKeys();
    //Definindo a tecla X na variável
    this.keyX = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.X);

}

function update() {
    //SE
    if (samState === false) {
        samurai.anims.play('idleSam', true);
    }

    if (samState === true) {
        samurai.anims.play('movSam', true);
    }
    
    //Mov do Sam
    if (teclado.left.isDown) {
        samurai.setVelocityX(-300);
        samState = true;
        samurai.setFlip(true, false);
    } else if (teclado.right.isDown) {
        samurai.setVelocityX(+300);
        samState = true;
        samurai.setFlip(false, false);
    }  else {
        samurai.setVelocityX(0);
        samState = false;
    }

    if (this.keyX.isDown) {
        isAttacking = true;
        samState = false;
    }

    if (samState === false && isAttacking === true) {
        samurai.anims.play('attackSam')
    }
}