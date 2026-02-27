// ============================================================================
// CLASSE: CENÁRIO DE INTRODUÇÃO (STATE MANAGEMENT)
// ============================================================================
// A escolha por estender Phaser.Scene via Classes (ES6) é a prática recomendada 
// para projetos escaláveis, facilitando o encapsulamento de métodos e atributos.

class IntroScene extends Phaser.Scene {
    
    // Construtor: Inicializa a instância da classe e define o identificador único
    constructor() {
        // O método super() é obrigatório aqui para invocar o comportamento da 
        // classe pai e registrar a chave 'IntroScene' no Scene Manager do Phaser.
        super({ key: 'IntroScene' });
    }

    // ========== MÉTODO: PRELOAD ==========
    // Ciclo de vida: Carregamento seletivo de assets. 
    // Como esta cena utiliza apenas elementos nativos (texto/geometria), 
    // mantemos o preload vazio para otimizar o tempo de inicialização (I/O).
    preload() {
        // Implementação futura: carregar logo do jogo ou música de menu aqui.
    }

    // ========== MÉTODO: CREATE ==========
    // Ciclo de vida: Instanciação da interface e listeners de eventos.
    create() {
        // Gerenciamento de Câmera: Define o estado visual inicial do viewport.
        this.cameras.main.setBackgroundColor('#000000');

        // Configuração de Estilo (UI Design):
        // Centralizamos as propriedades de renderização em um objeto constante 
        // para facilitar ajustes de design sem poluir a lógica de inserção.
        const style = { 
            font: '28px Arial', 
            fill: '#ffffff', 
            align: 'left' 
        };
        
        // Estrutura de Conteúdo:
        // O uso de um Array unido por .join('\n') é uma técnica de clean code, 
        // tornando a manutenção do texto muito mais simples que concatenar strings longas.
        const lines = [
            'Controles do jogo', 
            '', 
            '← → : mover', 
            '↑     : pular', 
            'X     : atacar', 
            'C     : dash', 
            '', 
            'Pressione [SPACE] para começar'
        ];

        // Renderização de Texto no Canvas:
        // Coordenadas (50, 100) aplicadas para respeitar margens de "safe area".
        this.add.text(50, 100, lines.join('\n'), style);

        // ========== SISTEMA DE INPUT (EVENT-DRIVEN) ==========
        // Em vez de verificar teclas no loop update(), utilizamos Event Listeners.
        // Isso é muito mais eficiente em termos de processamento (CPU).

        // Handler 1: Entrada via Teclado (Desktop)
        // O evento 'keydown-SPACE' é específico e evita overhead de checar todas as teclas.
        this.input.keyboard.on('keydown-SPACE', () => {
            // Scene Transition: Encerra esta cena e limpa a memória para carregar a GameScene.
            this.scene.start('GameScene');
        });
        
        // Handler 2: Entrada via Ponteiro (Cross-platform)
        // Essencial para UX Mobile; permite que o jogador toque em qualquer lugar da tela.
        this.input.on('pointerdown', () => {
            this.scene.start('GameScene');
        });
    }
    
    // Observação técnica: Omitimos o método update() propositalmente. 
    // Em cenas estáticas, não há necessidade de pollar a lógica 60 vezes por segundo, 
    // economizando recursos de hardware.
}