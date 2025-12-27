/**
 * CONTROLADOR PRINCIPAL DO JOGO DE XADREZ
 * Integra todas as partes: tabuleiro, regras, IA, sons e interface
 */

class ChessGame {
    constructor() {
        // Módulos do jogo
        this.rules = new ChessRules();
        this.ai = new ChessAI();
        this.soundManager = new SoundManager();
        
        // Estado do jogo
        this.gameState = {
            mode: 'pvp', // pvp, ai-easy, ai-medium, ai-hard, ai-expert, ai-master
            playerColor: 'white', // Cor que o jogador controla
            isPlayerTurn: true,
            gameActive: false,
            flipped: false, // Tabuleiro virado
            selectedSquare: null,
            validMoves: [],
            moveHistory: [],
            capturedPieces: { white: [], black: [] },
            timers: {
                white: 300, // 5 minutos em segundos
                black: 300,
                lastUpdate: Date.now()
            },
            settings: {
                soundEnabled: true,
                highlightsEnabled: true,
                boardColor: 'classic',
                animationSpeed: 'medium'
            }
        };
        
        // Elementos da interface
        this.elements = {
            board: null,
            squares: [],
            pieces: [],
            whiteClock: null,
            blackClock: null,
            gameStatus: null,
            moveHistory: null,
            currentTurn: null,
            moveNumber: null,
            checkStatus: null,
            pieceCount: null,
            whiteCaptured: null,
            blackCaptured: null,
            difficultyLevel: null,
            aiTime: null
        };
        
        // Variáveis de controle
        this.isDragging = false;
        this.draggedPiece = null;
        this.dragOffset = { x: 0, y: 0 };
        this.promotionPending = null;
        this.gameOver = false;
        this.animationQueue = [];
        this.isAnimating = false;
        
        // Inicialização
        this.init();
    }
    
    /**
     * Inicializa o jogo
     */
    async init() {
        console.log('Inicializando ChessGame...');
        
        // Obtém referências dos elementos
        this.getElements();
        
        // Cria o tabuleiro
        this.createBoard();
        
        // Configura event listeners
        this.setupEventListeners();
        
        // Inicializa IA
        await this.ai.init();
        
        // Carrega configurações salvas
        this.loadSettings();
        
        // Inicia um novo jogo
        this.newGame();
        
        console.log('ChessGame inicializado com sucesso');
    }
    
    /**
     * Obtém referências dos elementos DOM
     */
    getElements() {
        this.elements.board = document.getElementById('chess-board');
        this.elements.whiteClock = document.getElementById('white-clock');
        this.elements.blackClock = document.getElementById('black-clock');
        this.elements.gameStatus = document.getElementById('game-status');
        this.elements.moveHistory = document.getElementById('move-history');
        this.elements.currentTurn = document.getElementById('current-turn');
        this.elements.moveNumber = document.getElementById('move-number');
        this.elements.checkStatus = document.getElementById('check-status');
        this.elements.pieceCount = document.getElementById('piece-count');
        this.elements.whiteCaptured = document.getElementById('white-captured');
        this.elements.blackCaptured = document.getElementById('black-captured');
        this.elements.difficultyLevel = document.getElementById('difficulty-level');
        this.elements.aiTime = document.getElementById('ai-time');
    }
    
    /**
     * Cria o tabuleiro visual
     */
    createBoard() {
        if (!this.elements.board) return;
        
        this.elements.board.innerHTML = '';
        this.elements.squares = [];
        this.elements.pieces = [];
        
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const square = document.createElement('div');
                const displayRow = this.gameState.flipped ? 7 - row : row;
                const displayCol = this.gameState.flipped ? 7 - col : col;
                
                square.className = `chess-square ${(displayRow + displayCol) % 2 === 0 ? 'dark' : 'light'}`;
                square.dataset.row = row;
                square.dataset.col = col;
                
                // Adiciona peça se houver
                const piece = this.rules.board[displayRow][displayCol];
                if (piece) {
                    const pieceElement = this.createPieceElement(piece, displayRow, displayCol);
                    square.appendChild(pieceElement);
                    this.elements.pieces.push(pieceElement);
                }
                
                this.elements.board.appendChild(square);
                this.elements.squares.push(square);
            }
        }
        
        this.applyBoardColor();
    }
    
    /**
     * Cria elemento de peça
     */
    createPieceElement(piece, row, col) {
        const pieceElement = document.createElement('div');
        pieceElement.className = `chess-piece piece-${piece.color}`;
        pieceElement.dataset.row = row;
        pieceElement.dataset.col = col;
        pieceElement.dataset.type = piece.type;
        pieceElement.dataset.color = piece.color;
        pieceElement.textContent = this.rules.getPieceSymbol(piece);
        
        return pieceElement;
    }
    
    /**
     * Aplica cor do tabuleiro
     */
    applyBoardColor() {
        document.body.classList.remove(
            'board-color-green',
            'board-color-blue',
            'board-color-dark'
        );
        
        if (this.gameState.settings.boardColor !== 'classic') {
            document.body.classList.add(`board-color-${this.gameState.settings.boardColor}`);
        }
    }
    
    /**
     * Configura todos os event listeners
     */
    setupEventListeners() {
        // Modos de jogo
        document.querySelectorAll('.mode-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.setGameMode(e.target.dataset.mode || e.target.closest('.mode-btn').dataset.mode);
            });
        });
        
        // Controles do jogo
        document.getElementById('btn-new-game').addEventListener('click', () => this.newGame());
        document.getElementById('btn-undo').addEventListener('click', () => this.undoMove());
        document.getElementById('btn-redo').addEventListener('click', () => this.redoMove());
        document.getElementById('btn-flip-board').addEventListener('click', () => this.flipBoard());
        document.getElementById('btn-hint').addEventListener('click', () => this.showHint());
        document.getElementById('btn-save').addEventListener('click', () => this.saveGame());
        document.getElementById('btn-load').addEventListener('click', () => this.loadGame());
        document.getElementById('btn-resign').addEventListener('click', () => this.resign());
        document.getElementById('btn-rematch').addEventListener('click', () => this.rematch());
        document.getElementById('btn-new-game-modal').addEventListener('click', () => {
            document.getElementById('gameover-modal').style.display = 'none';
            this.newGame();
        });
        
        // Configurações
        document.getElementById('sound-toggle').addEventListener('change', (e) => {
            this.gameState.settings.soundEnabled = e.target.checked;
            this.saveSettings();
        });
        
        document.getElementById('highlight-toggle').addEventListener('change', (e) => {
            this.gameState.settings.highlightsEnabled = e.target.checked;
            this.saveSettings();
        });
        
        document.getElementById('board-color').addEventListener('change', (e) => {
            this.gameState.settings.boardColor = e.target.value;
            this.applyBoardColor();
            this.saveSettings();
        });
        
        document.getElementById('time-control').addEventListener('change', (e) => {
            const minutes = parseInt(e.target.value);
            this.setTimeControl(minutes);
        });
        
        // Modal de promoção
        document.querySelectorAll('.promotion-piece').forEach(piece => {
            piece.addEventListener('click', (e) => {
                const promotionPiece = e.currentTarget.dataset.piece;
                this.completePromotion(promotionPiece);
            });
        });
        
        document.getElementById('cancel-promotion').addEventListener('click', () => {
            this.cancelPromotion();
        });
        
        // Configurações avançadas
        document.getElementById('btn-settings').addEventListener('click', () => {
            this.showSettingsModal();
        });
        
        document.getElementById('save-settings').addEventListener('click', () => {
            this.saveAdvancedSettings();
        });
        
        document.getElementById('close-settings').addEventListener('click', () => {
            document.getElementById('settings-modal').style.display = 'none';
        });
        
        // Event listeners para arrastar peças
        this.setupDragAndDrop();
        
        // Atualização do timer
        setInterval(() => this.updateTimers(), 1000);
    }
    
    /**
     * Configura sistema de arrastar e soltar
     */
    setupDragAndDrop() {
        // Para desktop: mouse events
        this.elements.board.addEventListener('mousedown', (e) => this.startDrag(e));
        document.addEventListener('mousemove', (e) => this.dragPiece(e));
        document.addEventListener('mouseup', (e) => this.dropPiece(e));
        
        // Para mobile: touch events
        this.elements.board.addEventListener('touchstart', (e) => this.startDrag(e), { passive: false });
        document.addEventListener('touchmove', (e) => this.dragPiece(e), { passive: false });
        document.addEventListener('touchend', (e) => this.dropPiece(e));
        
        // Click para seleção
        this.elements.board.addEventListener('click', (e) => {
            const square = e.target.closest('.chess-square');
            if (square && !this.isDragging) {
                this.handleSquareClick(square);
            }
        });
    }
    
    /**
     * Inicia arrasto de peça
     */
    startDrag(e) {
        if (this.gameOver || this.promotionPending) return;
        
        const touch = e.type === 'touchstart';
        const clientX = touch ? e.touches[0].clientX : e.clientX;
        const clientY = touch ? e.touches[0].clientY : e.clientY;
        
        const pieceElement = e.target.closest('.chess-piece');
        if (!pieceElement) return;
        
        const row = parseInt(pieceElement.dataset.row);
        const col = parseInt(pieceElement.dataset.col);
        const color = pieceElement.dataset.color;
        
        // Verifica se é a vez do jogador
        if (color !== this.rules.gameState.turn) return;
        
        // Verifica modo de jogo
        if (this.gameState.mode !== 'pvp' && color !== this.gameState.playerColor) return;
        
        e.preventDefault();
        
        this.isDragging = true;
        this.draggedPiece = pieceElement;
        
        // Calcula offset
        const rect = pieceElement.getBoundingClientRect();
        this.dragOffset.x = clientX - rect.left;
        this.dragOffset.y = clientY - rect.top;
        
        // Adiciona classe de arrasto
        pieceElement.classList.add('dragging');
        pieceElement.style.position = 'fixed';
        pieceElement.style.zIndex = '1000';
        
        this.soundManager.play('piece_pickup');
        
        // Mostra movimentos válidos
        this.showValidMoves(row, col);
    }
    
    /**
     * Arrasta peça
     */
    dragPiece(e) {
        if (!this.isDragging || !this.draggedPiece) return;
        
        const touch = e.type === 'touchmove';
        const clientX = touch ? e.touches[0].clientX : e.clientX;
        const clientY = touch ? e.touches[0].clientY : e.clientY;
        
        e.preventDefault();
        
        // Atualiza posição
        this.draggedPiece.style.left = `${clientX - this.dragOffset.x}px`;
        this.draggedPiece.style.top = `${clientY - this.dragOffset.y}px`;
        
        // Destaca casa sob a peça
        this.highlightHoverSquare(clientX, clientY);
    }
    
    /**
     * Destaca casa sob o cursor/dedo
     */
    highlightHoverSquare(clientX, clientY) {
        // Remove highlight anterior
        this.elements.squares.forEach(sq => sq.classList.remove('hover'));
        
        // Encontra casa sob o cursor
        const boardRect = this.elements.board.getBoundingClientRect();
        const relativeX = clientX - boardRect.left;
        const relativeY = clientY - boardRect.top;
        
        const squareSize = boardRect.width / 8;
        const col = Math.floor(relativeX / squareSize);
        const row = Math.floor(relativeY / squareSize);
        
        if (row >= 0 && row < 8 && col >= 0 && col < 8) {
            const index = row * 8 + col;
            this.elements.squares[index].classList.add('hover');
        }
    }
    
    /**
     * Solta peça
     */
    dropPiece(e) {
        if (!this.isDragging || !this.draggedPiece) return;
        
        const touch = e.type === 'touchend';
        const clientX = touch ? (e.changedTouches[0] ? e.changedTouches[0].clientX : 0) : e.clientX;
        const clientY = touch ? (e.changedTouches[0] ? e.changedTouches[0].clientY : 0) : e.clientY;
        
        // Remove classes de arrasto
        this.draggedPiece.classList.remove('dragging');
        this.draggedPiece.style.position = '';
        this.draggedPiece.style.zIndex = '';
        this.draggedPiece.style.left = '';
        this.draggedPiece.style.top = '';
        
        // Remove highlight de hover
        this.elements.squares.forEach(sq => sq.classList.remove('hover'));
        
        // Encontra casa de destino
        const boardRect = this.elements.board.getBoundingClientRect();
        const relativeX = clientX - boardRect.left;
        const relativeY = clientY - boardRect.top;
        
        const squareSize = boardRect.width / 8;
        const toCol = Math.floor(relativeX / squareSize);
        const toRow = Math.floor(relativeY / squareSize);
        
        // Obtém posição de origem
        const fromRow = parseInt(this.draggedPiece.dataset.row);
        const fromCol = parseInt(this.draggedPiece.dataset.col);
        
        // Verifica se o movimento é válido
        const isValidMove = this.gameState.validMoves.some(move => 
            move.to.row === toRow && move.to.col === toCol
        );
        
        if (isValidMove && toRow >= 0 && toRow < 8 && toCol >= 0 && toCol < 8) {
            // Executa movimento
            this.makeMove({ row: fromRow, col: fromCol }, { row: toRow, col: toCol });
        } else {
            // Retorna peça à posição original
            this.returnPieceToSquare(this.draggedPiece, fromRow, fromCol);
        }
        
        this.isDragging = false;
        this.draggedPiece = null;
        this.clearValidMoves();
    }
    
    /**
     * Retorna peça à casa original
     */
    returnPieceToSquare(pieceElement, row, col) {
        const square = this.getSquareElement(row, col);
        square.appendChild(pieceElement);
        this.soundManager.play('illegal');
    }
    
    /**
     * Manipula clique em casa
     */
    handleSquareClick(square) {
        if (this.gameOver || this.promotionPending) return;
        
        const row = parseInt(square.dataset.row);
        const col = parseInt(square.dataset.col);
        
        // Se já tem uma peça selecionada, tenta mover
        if (this.gameState.selectedSquare) {
            const from = this.gameState.selectedSquare;
            const isValid = this.gameState.validMoves.some(move => 
                move.to.row === row && move.to.col === toCol
            );
            
            if (isValid) {
                this.makeMove(from, { row, col });
            } else {
                // Seleciona nova peça
                this.selectSquare(row, col);
            }
        } else {
            // Seleciona peça
            this.selectSquare(row, col);
        }
    }
    
    /**
     * Seleciona casa
     */
    selectSquare(row, col) {
        // Limpa seleção anterior
        this.clearSelection();
        
        const piece = this.rules.board[row][col];
        if (!piece) return;
        
        // Verifica se é a vez do jogador
        if (piece.color !== this.rules.gameState.turn) return;
        
        // Verifica modo de jogo
        if (this.gameState.mode !== 'pvp' && piece.color !== this.gameState.playerColor) return;
        
        // Marca como selecionada
        this.gameState.selectedSquare = { row, col };
        this.getSquareElement(row, col).classList.add('selected');
        
        // Mostra movimentos válidos
        this.showValidMoves(row, col);
        
        this.soundManager.play('click');
    }
    
    /**
     * Mostra movimentos válidos para uma peça
     */
    showValidMoves(row, col) {
        if (!this.gameState.settings.highlightsEnabled) return;
        
        this.clearValidMoves();
        
        const piece = this.rules.board[row][col];
        if (!piece) return;
        
        // Obtém movimentos válidos
        const moves = this.rules.getPieceMoves(row, col, piece);
        this.gameState.validMoves = moves.map(to => ({ from: { row, col }, to }));
        
        // Destaca casas
        moves.forEach(move => {
            const square = this.getSquareElement(move.row, move.col);
            const targetPiece = this.rules.board[move.row][move.col];
            
            if (targetPiece) {
                square.classList.add('valid-capture');
            } else {
                square.classList.add('valid-move');
            }
        });
    }
    
    /**
     * Limpa seleção e movimentos válidos
     */
    clearSelection() {
        this.elements.squares.forEach(sq => {
            sq.classList.remove('selected', 'valid-move', 'valid-capture');
        });
        
        this.gameState.selectedSquare = null;
        this.gameState.validMoves = [];
    }
    
    /**
     * Limpa apenas os movimentos válidos
     */
    clearValidMoves() {
        this.elements.squares.forEach(sq => {
            sq.classList.remove('valid-move', 'valid-capture');
        });
        this.gameState.validMoves = [];
    }
    
    /**
     * Executa movimento
     */
    async makeMove(from, to) {
        if (this.gameOver) return;
        
        // Executa movimento nas regras
        const result = this.rules.makeMove(from, to);
        
        if (!result.success) {
            this.soundManager.play('illegal');
            this.showNotification(result.error, 'error');
            return;
        }
        
        // Atualiza interface
        this.updateBoard();
        
        // Toca som apropriado
        this.playMoveSound(result.moveRecord);
        
        // Atualiza histórico
        this.updateMoveHistory();
        
        // Atualiza peças capturadas
        this.updateCapturedPieces();
        
        // Atualiza status do jogo
        this.updateGameStatus();
        
        // Verifica promoção
        if (result.moveRecord.moveType === 'promotion') {
            this.handlePromotion(from, to);
            return;
        }
        
        // Limpa seleção
        this.clearSelection();
        
        // Verifica fim de jogo
        if (result.checkmate || result.stalemate || result.draw) {
            this.handleGameOver(result);
            return;
        }
        
        // Alterna turno
        this.gameState.isPlayerTurn = !this.gameState.isPlayerTurn;
        
        // Atualiza interface do turno
        this.updateTurnIndicator();
        
        // Se for vez da IA, faz movimento
        if (this.gameState.mode !== 'pvp' && !this.gameState.isPlayerTurn) {
            await this.makeAIMove();
        }
    }
    
    /**
     * Movimento da IA
     */
    async makeAIMove() {
        if (this.gameOver) return;
        
        // Mostra status
        this.elements.gameStatus.textContent = 'IA pensando...';
        
        // Obtém FEN atual
        const fen = this.rules.exportFEN();
        
        // Configura callback para análise
        const analysisCallback = (data) => {
            this.elements.aiTime.textContent = `${data.depth}/∞`;
        };
        
        // Obtém melhor movimento da IA
        const startTime = Date.now();
        
        this.ai.getBestMove(fen, (move) => {
            const thinkingTime = Date.now() - startTime;
            
            if (move) {
                // Executa movimento da IA
                const result = this.rules.makeMove(move.from, move.to, move.promotion);
                
                if (result.success) {
                    // Atualiza interface
                    this.updateBoard();
                    this.playMoveSound(result.moveRecord);
                    this.updateMoveHistory();
                    this.updateCapturedPieces();
                    this.updateGameStatus();
                    
                    // Verifica promoção (IA sempre promove para rainha)
                    if (result.moveRecord.moveType === 'promotion') {
                        this.updateBoard(); // Atualiza novamente para mostrar rainha
                    }
                    
                    // Verifica fim de jogo
                    if (result.checkmate || result.stalemate || result.draw) {
                        this.handleGameOver(result);
                        return;
                    }
                    
                    // Alterna turno
                    this.gameState.isPlayerTurn = true;
                    this.updateTurnIndicator();
                    
                    // Atualiza status
                    this.elements.gameStatus.textContent = 'Sua vez';
                    this.elements.aiTime.textContent = `${thinkingTime}ms`;
                }
            }
        }, analysisCallback);
    }
    
    /**
     * Toca som apropriado para movimento
     */
    playMoveSound(moveRecord) {
        if (!this.gameState.settings.soundEnabled) return;
        
        switch (moveRecord.moveType) {
            case 'capture':
            case 'enPassant':
                this.soundManager.play('capture');
                break;
            case 'castling':
                this.soundManager.play('castle');
                break;
            case 'check':
                this.soundManager.play('check');
                break;
            case 'promotion':
                this.soundManager.play('promotion');
                break;
            default:
                this.soundManager.play('move');
        }
        
        if (this.rules.gameState.check) {
            this.soundManager.play('check');
        }
    }
    
    /**
     * Atualiza tabuleiro visual
     */
    updateBoard() {
        // Remove todas as peças
        this.elements.pieces.forEach(piece => piece.remove());
        this.elements.pieces = [];
        
        // Adiciona peças atualizadas
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const piece = this.rules.board[row][col];
                const square = this.getSquareElement(row, col);
                
                if (piece) {
                    const pieceElement = this.createPieceElement(piece, row, col);
                    square.appendChild(pieceElement);
                    this.elements.pieces.push(pieceElement);
                } else {
                    // Limpa casa
                    square.innerHTML = '';
                }
            }
        }
    }
    
    /**
     * Obtém elemento de casa
     */
    getSquareElement(row, col) {
        const displayRow = this.gameState.flipped ? 7 - row : row;
        const displayCol = this.gameState.flipped ? 7 - col : col;
        const index = displayRow * 8 + displayCol;
        return this.elements.squares[index];
    }
    
    /**
     * Atualiza histórico de movimentos
     */
    updateMoveHistory() {
        if (!this.elements.moveHistory) return;
        
        const moves = this.rules.getMoveHistory();
        this.elements.moveHistory.innerHTML = '';
        
        moves.forEach(move => {
            const item = document.createElement('div');
            item.className = 'move-history-item';
            
            item.innerHTML = `
                <span class="move-number">${move.number}.</span>
                <span class="white-move">${move.white || ''}</span>
                <span class="black-move">${move.black || ''}</span>
            `;
            
            // Destaca último movimento
            if (move.number * 2 - (move.black ? 0 : 1) === this.rules.gameState.moveHistory.length) {
                item.classList.add('current');
            }
            
            item.addEventListener('click', () => {
                this.replayToMove(move.number, move.white ? 'white' : 'black');
            });
            
            this.elements.moveHistory.appendChild(item);
        });
        
        // Rola para o final
        this.elements.moveHistory.scrollTop = this.elements.moveHistory.scrollHeight;
        
        // Atualiza contador
        this.elements.moveNumber.textContent = this.rules.gameState.fullMoveNumber;
    }
    
    /**
     * Atualiza peças capturadas
     */
    updateCapturedPieces() {
        const captured = this.rules.getCapturedPieces();
        
        // Atualiza brancas capturadas (peças pretas capturadas)
        this.elements.whiteCaptured.innerHTML = captured.black
            .map(piece => `<span class="captured-piece">${this.rules.getPieceSymbol(piece)}</span>`)
            .join('');
        
        // Atualiza pretas capturadas (peças brancas capturadas)
        this.elements.blackCaptured.innerHTML = captured.white
            .map(piece => `<span class="captured-piece">${this.rules.getPieceSymbol(piece)}</span>`)
            .join('');
        
        // Atualiza contagem de peças
        const stats = this.rules.getGameStats();
        this.elements.pieceCount.textContent = stats.totalPieces;
    }
    
    /**
     * Atualiza status do jogo
     */
    updateGameStatus() {
        // Atualiza status de xeque
        this.elements.checkStatus.textContent = this.rules.gameState.check ? 'Sim' : 'Não';
        
        // Atualiza estado do tabuleiro
        if (this.rules.gameState.checkmate) {
            this.elements.boardState.textContent = 'Xeque-mate';
        } else if (this.rules.gameState.stalemate) {
            this.elements.boardState.textContent = 'Afogamento';
        } else if (this.rules.gameState.draw) {
            this.elements.boardState.textContent = 'Empate';
        } else {
            this.elements.boardState.textContent = 'Ativo';
        }
        
        // Atualiza status do jogo
        if (this.rules.gameState.checkmate) {
            this.elements.gameStatus.textContent = `Xeque-mate! ${this.rules.gameState.turn === 'white' ? 'Preto' : 'Branco'} venceu!`;
        } else if (this.rules.gameState.stalemate) {
            this.elements.gameStatus.textContent = 'Afogamento! Empate!';
        } else if (this.rules.gameState.draw) {
            this.elements.gameStatus.textContent = 'Empate!';
        } else if (this.rules.gameState.check) {
            this.elements.gameStatus.textContent = `${this.rules.gameState.turn === 'white' ? 'Branco' : 'Preto'} em xeque!`;
        } else {
            this.elements.gameStatus.textContent = `${this.rules.gameState.turn === 'white' ? 'Branco' : 'Preto'} a jogar`;
        }
        
        // Destaca rei em xeque
        if (this.rules.gameState.check) {
            const kingPos = this.rules.findKingPosition(this.rules.gameState.turn);
            if (kingPos) {
                this.getSquareElement(kingPos.row, kingPos.col).classList.add('check-warning');
            }
        }
    }
    
    /**
     * Atualiza indicador de turno
     */
    updateTurnIndicator() {
        this.elements.currentTurn.textContent = this.rules.gameState.turn === 'white' ? 'Branco' : 'Preto';
    }
    
    /**
     * Atualiza timers
     */
    updateTimers() {
        if (!this.gameState.gameActive || this.gameOver) return;
        
        const now = Date.now();
        const elapsed = (now - this.gameState.timers.lastUpdate) / 1000;
        this.gameState.timers.lastUpdate = now;
        
        // Atualiza timer do jogador atual
        if (this.rules.gameState.turn === 'white') {
            this.gameState.timers.white = Math.max(0, this.gameState.timers.white - elapsed);
        } else {
            this.gameState.timers.black = Math.max(0, this.gameState.timers.black - elapsed);
        }
        
        // Atualiza display
        this.elements.whiteClock.textContent = this.formatTime(this.gameState.timers.white);
        this.elements.blackClock.textContent = this.formatTime(this.gameState.timers.black);
        
        // Verifica timeout
        if (this.gameState.timers.white <= 0 || this.gameState.timers.black <= 0) {
            this.handleTimeout();
        }
    }
    
    /**
     * Formata tempo (MM:SS)
     */
    formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    
    /**
     * Trata timeout
     */
    handleTimeout() {
        const winner = this.gameState.timers.white <= 0 ? 'Preto' : 'Branco';
        this.showGameOverModal(`${winner} venceu por tempo!`, 'timeout');
    }
    
    /**
     * Trata promoção de peão
     */
    handlePromotion(from, to) {
        this.promotionPending = { from, to };
        
        // Mostra modal de promoção
        const modal = document.getElementById('promotion-modal');
        modal.style.display = 'flex';
        
        // Posiciona modal perto da promoção
        const square = this.getSquareElement(to.row, to.col);
        const rect = square.getBoundingClientRect();
        modal.querySelector('.modal-content').style.position = 'absolute';
        modal.querySelector('.modal-content').style.left = `${rect.left}px`;
        modal.querySelector('.modal-content').style.top = `${rect.top - 200}px`;
    }
    
    /**
     * Completa promoção
     */
    completePromotion(pieceType) {
        if (!this.promotionPending) return;
        
        // Converte tipo de peça
        const promotionMap = {
            'queen': 'queen',
            'rook': 'rook',
            'bishop': 'bishop',
            'knight': 'knight'
        };
        
        const promotionPiece = promotionMap[pieceType] || 'queen';
        
        // Executa movimento com promoção
        const result = this.rules.makeMove(
            this.promotionPending.from,
            this.promotionPending.to,
            promotionPiece
        );
        
        if (result.success) {
            // Atualiza interface
            this.updateBoard();
            this.soundManager.play('promotion');
            this.updateMoveHistory();
            this.updateGameStatus();
            
            // Fecha modal
            document.getElementById('promotion-modal').style.display = 'none';
            this.promotionPending = null;
            
            // Verifica fim de jogo
            if (result.checkmate || result.stalemate || result.draw) {
                this.handleGameOver(result);
                return;
            }
            
            // Alterna turno
            this.gameState.isPlayerTurn = !this.gameState.isPlayerTurn;
            this.updateTurnIndicator();
            
            // Se for vez da IA
            if (this.gameState.mode !== 'pvp' && !this.gameState.isPlayerTurn) {
                this.makeAIMove();
            }
        }
    }
    
    /**
     * Cancela promoção
     */
    cancelPromotion() {
        // Desfaz movimento
        this.rules.undoMove();
        this.updateBoard();
        
        // Fecha modal
        document.getElementById('promotion-modal').style.display = 'none';
        this.promotionPending = null;
    }
    
    /**
     * Trata fim de jogo
     */
    handleGameOver(result) {
        this.gameOver = true;
        this.gameState.gameActive = false;
        
        let title = 'Fim de Jogo!';
        let message = '';
        let type = '';
        
        if (result.checkmate) {
            const winner = this.rules.gameState.turn === 'white' ? 'Preto' : 'Branco';
            title = 'Xeque-mate!';
            message = `${winner} venceu!`;
            type = 'checkmate';
            this.soundManager.play('checkmate');
        } else if (result.stalemate) {
            title = 'Afogamento!';
            message = 'Empate por afogamento!';
            type = 'stalemate';
            this.soundManager.play('draw');
        } else if (result.draw) {
            title = 'Empate!';
            message = 'O jogo terminou em empate!';
            type = 'draw';
            this.soundManager.play('draw');
        }
        
        this.showGameOverModal(message, type);
    }
    
    /**
     * Mostra modal de fim de jogo
     */
    showGameOverModal(message, type) {
        const modal = document.getElementById('gameover-modal');
        const title = document.getElementById('gameover-title');
        const result = document.getElementById('gameover-result');
        const moves = document.getElementById('gameover-moves');
        const time = document.getElementById('gameover-time');
        const winner = document.getElementById('gameover-winner');
        
        title.textContent = type === 'checkmate' ? 'Xeque-mate!' : 
                          type === 'stalemate' ? 'Afogamento!' : 
                          type === 'draw' ? 'Empate!' : 'Fim de Jogo!';
        
        result.textContent = message;
        moves.textContent = this.rules.gameState.moveHistory.length;
        time.textContent = this.formatTime(300 - Math.min(this.gameState.timers.white, this.gameState.timers.black));
        winner.textContent = type === 'checkmate' ? (this.rules.gameState.turn === 'white' ? 'Preto' : 'Branco') : 'Nenhum';
        
        modal.style.display = 'flex';
        this.soundManager.play(type === 'checkmate' ? 'checkmate' : 'game_end');
    }
    
    /**
     * Mostra notificação
     */
    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <i class="fas fa-${type === 'error' ? 'exclamation-circle' : type === 'warning' ? 'exclamation-triangle' : 'info-circle'}"></i>
            <span>${message}</span>
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }
    
    /**
     * Define modo de jogo
     */
    setGameMode(mode) {
        this.gameState.mode = mode;
        
        // Atualiza botões ativos
        document.querySelectorAll('.mode-btn').forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.mode === mode) {
                btn.classList.add('active');
            }
        });
        
        // Atualiza display de dificuldade
        const levelNames = {
            'pvp': 'PvP',
            'ai-easy': 'Fácil',
            'ai-medium': 'Média',
            'ai-hard': 'Difícil',
            'ai-expert': 'Avançada',
            'ai-master': 'Super Avançada'
        };
        
        this.elements.difficultyLevel.textContent = levelNames[mode] || 'PvP';
        
        // Configura IA se necessário
        if (mode !== 'pvp') {
            const aiLevel = mode.replace('ai-', '');
            this.ai.setLevel(aiLevel);
            
            // Define cor do jogador (sempre branco contra IA)
            this.gameState.playerColor = 'white';
            this.gameState.isPlayerTurn = true;
        }
        
        // Inicia novo jogo
        this.newGame();
    }
    
    /**
     * Inicia novo jogo
     */
    newGame() {
        // Reinicia regras
        this.rules.reset();
        
        // Reinicia estado do jogo
        this.gameOver = false;
        this.gameState.gameActive = true;
        this.gameState.selectedSquare = null;
        this.gameState.validMoves = [];
        this.promotionPending = null;
        
        // Reinicia timers
        const minutes = parseInt(document.getElementById('time-control').value) || 5;
        this.setTimeControl(minutes);
        
        // Atualiza interface
        this.createBoard();
        this.updateMoveHistory();
        this.updateCapturedPieces();
        this.updateGameStatus();
        this.updateTurnIndicator();
        
        // Atualiza status
        this.elements.gameStatus.textContent = 'Novo jogo iniciado!';
        
        // Toca som
        this.soundManager.play('game_start');
        
        // Se for modo IA e jogador é preto, IA começa
        if (this.gameState.mode !== 'pvp' && this.gameState.playerColor === 'black') {
            this.gameState.isPlayerTurn = false;
            this.makeAIMove();
        }
    }
    
    /**
     * Define controle de tempo
     */
    setTimeControl(minutes) {
        const seconds = minutes * 60;
        this.gameState.timers = {
            white: seconds,
            black: seconds,
            lastUpdate: Date.now()
        };
        
        this.elements.whiteClock.textContent = this.formatTime(seconds);
        this.elements.blackClock.textContent = this.formatTime(seconds);
    }
    
    /**
     * Desfaz movimento
     */
    undoMove() {
        if (this.rules.gameState.moveHistory.length === 0) return;
        
        const result = this.rules.undoMove();
        if (result.success) {
            // Atualiza interface
            this.updateBoard();
            this.updateMoveHistory();
            this.updateCapturedPieces();
            this.updateGameStatus();
            this.updateTurnIndicator();
            
            // Se for modo IA, desfaz também movimento da IA
            if (this.gameState.mode !== 'pvp' && !this.gameState.isPlayerTurn) {
                this.rules.undoMove();
                this.updateBoard();
                this.updateMoveHistory();
                this.updateCapturedPieces();
                this.updateGameStatus();
            }
            
            this.gameState.isPlayerTurn = true;
            this.soundManager.play('click');
        }
    }
    
    /**
     * Refaz movimento (se implementado)
     */
    redoMove() {
        // Implementação básica - em produção seria mais complexa
        this.showNotification('Funcionalidade em desenvolvimento', 'info');
    }
    
    /**
     * Vira tabuleiro
     */
    flipBoard() {
        this.gameState.flipped = !this.gameState.flipped;
        this.createBoard();
        this.soundManager.play('click');
    }
    
    /**
     * Mostra dica
     */
    async showHint() {
        if (this.gameOver || this.promotionPending) return;
        if (this.gameState.mode !== 'pvp' && !this.gameState.isPlayerTurn) return;
        
        const fen = this.rules.exportFEN();
        const hint = await this.ai.getHint(fen, this.rules.gameState.turn);
        
        if (hint) {
            // Destaca movimento sugerido
            this.clearSelection();
            this.getSquareElement(hint.from.row, hint.from.col).classList.add('selected');
            this.getSquareElement(hint.to.row, hint.to.col).classList.add('hint-move');
            
            this.soundManager.play('notification');
            this.showNotification('Dica mostrada! Movimento em destaque.', 'info');
            
            // Remove destaque após 3 segundos
            setTimeout(() => {
                this.clearSelection();
            }, 3000);
        }
    }
    
    /**
     * Salva jogo
     */
    saveGame() {
        try {
            const gameData = {
                fen: this.rules.exportFEN(),
                mode: this.gameState.mode,
                moveHistory: this.rules.gameState.moveHistory,
                timers: this.gameState.timers,
                settings: this.gameState.settings,
                timestamp: Date.now()
            };
            
            const key = `chess_save_${Date.now()}`;
            localStorage.setItem(key, JSON.stringify(gameData));
            
            // Salva também como último jogo
            localStorage.setItem('chess_last_game', JSON.stringify(gameData));
            
            this.showNotification('Jogo salvo com sucesso!', 'success');
            this.soundManager.play('notification');
            
        } catch (error) {
            this.showNotification('Erro ao salvar jogo', 'error');
        }
    }
    
    /**
     * Carrega jogo
     */
    loadGame() {
        try {
            const saved = localStorage.getItem('chess_last_game');
            if (!saved) {
                this.showNotification('Nenhum jogo salvo encontrado', 'warning');
                return;
            }
            
            const gameData = JSON.parse(saved);
            
            // Carrega FEN
            this.rules.loadFEN(gameData.fen);
            
            // Atualiza estado do jogo
            this.gameState.mode = gameData.mode || 'pvp';
            this.gameState.timers = gameData.timers || this.gameState.timers;
            this.gameState.settings = { ...this.gameState.settings, ...gameData.settings };
            
            // Atualiza interface
            this.updateBoard();
            this.updateMoveHistory();
            this.updateCapturedPieces();
            this.updateGameStatus();
            this.updateTurnIndicator();
            
            // Atualiza controles
            this.setGameMode(this.gameState.mode);
            this.applyBoardColor();
            
            this.gameOver = false;
            this.gameState.gameActive = true;
            
            this.showNotification('Jogo carregado com sucesso!', 'success');
            this.soundManager.play('game_start');
            
        } catch (error) {
            this.showNotification('Erro ao carregar jogo', 'error');
        }
    }
    
    /**
     * Desiste
     */
    resign() {
        if (!this.gameState.gameActive || this.gameOver) return;
        
        if (confirm('Tem certeza que deseja desistir?')) {
            const winner = this.rules.gameState.turn === 'white' ? 'Preto' : 'Branco';
            this.showGameOverModal(`${winner} venceu por desistência!`, 'resignation');
            this.soundManager.play('defeat');
        }
    }
    
    /**
     * Revanche
     */
    rematch() {
        document.getElementById('gameover-modal').style.display = 'none';
        
        // Mantém modo, inverte cores se for PvP
        if (this.gameState.mode === 'pvp') {
            this.gameState.playerColor = this.gameState.playerColor === 'white' ? 'black' : 'white';
        }
        
        this.newGame();
    }
    
    /**
     * Replay para movimento específico
     */
    replayToMove(moveNumber, color) {
        // Implementação simplificada
        this.showNotification('Replay em desenvolvimento', 'info');
    }
    
    /**
     * Mostra modal de configurações
     */
    showSettingsModal() {
        // Carrega configurações atuais nos controles
        document.getElementById('setting-en-passant').checked = this.rules.settings.enPassantEnabled;
        document.getElementById('setting-castling').checked = this.rules.settings.castlingEnabled;
        document.getElementById('setting-pawn-double').checked = this.rules.settings.pawnDoubleMoveEnabled;
        document.getElementById('setting-promotion').checked = this.rules.settings.autoQueenPromotion;
        document.getElementById('setting-50move').checked = this.rules.settings.fiftyMoveRuleEnabled;
        
        document.getElementById('master-volume').value = this.soundManager.volumeLevels.master;
        document.getElementById('move-volume').value = this.soundManager.volumeLevels.move;
        document.getElementById('capture-volume').value = this.soundManager.volumeLevels.capture;
        document.getElementById('check-volume').value = this.soundManager.volumeLevels.check;
        
        document.getElementById('piece-size').value = this.gameState.settings.animationSpeed || 'medium';
        document.getElementById('piece-style').value = 'merida'; // Placeholder
        document.getElementById('animation-speed').value = this.gameState.settings.animationSpeed || 'medium';
        
        // Mostra modal
        document.getElementById('settings-modal').style.display = 'flex';
    }
    
    /**
     * Salva configurações avançadas
     */
    saveAdvancedSettings() {
        // Atualiza regras
        this.rules.updateSettings({
            enPassantEnabled: document.getElementById('setting-en-passant').checked,
            castlingEnabled: document.getElementById('setting-castling').checked,
            pawnDoubleMoveEnabled: document.getElementById('setting-pawn-double').checked,
            autoQueenPromotion: document.getElementById('setting-promotion').checked,
            fiftyMoveRuleEnabled: document.getElementById('setting-50move').checked
        });
        
        // Atualiza sons
        this.soundManager.updateVolumeLevels({
            master: parseInt(document.getElementById('master-volume').value),
            move: parseInt(document.getElementById('move-volume').value),
            capture: parseInt(document.getElementById('capture-volume').value),
            check: parseInt(document.getElementById('check-volume').value)
        });
        
        // Atualiza aparência
        this.gameState.settings.animationSpeed = document.getElementById('animation-speed').value;
        
        // Salva configurações
        this.saveSettings();
        
        // Fecha modal
        document.getElementById('settings-modal').style.display = 'none';
        
        this.showNotification('Configurações salvas!', 'success');
        this.soundManager.play('notification');
    }
    
    /**
     * Salva configurações
     */
    saveSettings() {
        try {
            const settings = {
                soundEnabled: this.gameState.settings.soundEnabled,
                highlightsEnabled: this.gameState.settings.highlightsEnabled,
                boardColor: this.gameState.settings.boardColor,
                animationSpeed: this.gameState.settings.animationSpeed,
                rules: this.rules.settings,
                soundLevels: this.soundManager.volumeLevels
            };
            
            localStorage.setItem('chess_settings', JSON.stringify(settings));
        } catch (error) {
            console.error('Erro ao salvar configurações:', error);
        }
    }
    
    /**
     * Carrega configurações
     */
    loadSettings() {
        try {
            const saved = localStorage.getItem('chess_settings');
            if (saved) {
                const settings = JSON.parse(saved);
                
                // Configurações gerais
                this.gameState.settings = {
                    ...this.gameState.settings,
                    soundEnabled: settings.soundEnabled !== undefined ? settings.soundEnabled : true,
                    highlightsEnabled: settings.highlightsEnabled !== undefined ? settings.highlightsEnabled : true,
                    boardColor: settings.boardColor || 'classic',
                    animationSpeed: settings.animationSpeed || 'medium'
                };
                
                // Regras
                if (settings.rules) {
                    this.rules.updateSettings(settings.rules);
                }
                
                // Sons
                if (settings.soundLevels) {
                    this.soundManager.volumeLevels = settings.soundLevels;
                }
                
                // Atualiza controles
                document.getElementById('sound-toggle').checked = this.gameState.settings.soundEnabled;
                document.getElementById('highlight-toggle').checked = this.gameState.settings.highlightsEnabled;
                document.getElementById('board-color').value = this.gameState.settings.boardColor;
                
                console.log('Configurações carregadas');
            }
        } catch (error) {
            console.error('Erro ao carregar configurações:', error);
        }
    }
    
    /**
     * Exporta jogo como PGN
     */
    exportPGN() {
        // Implementação básica de PGN
        let pgn = `[Event "Xadrez PvP"]\n`;
        pgn += `[Site "xadrezpvp.netlify.app"]\n`;
        pgn += `[Date "${new Date().toISOString().split('T')[0]}"]\n`;
        pgn += `[White "${this.gameState.mode === 'pvp' ? 'Jogador' : 'Humano'}"]\n`;
        pgn += `[Black "${this.gameState.mode === 'pvp' ? 'Jogador' : 'IA'}"]\n`;
        pgn += `[Result "${this.rules.getGameResult() || '*"}"]\n\n`;
        
        const moves = this.rules.getMoveHistory();
        moves.forEach((move, index) => {
            if (move.white) {
                pgn += `${move.number}. ${move.white} `;
                if (move.black) {
                    pgn += `${move.black} `;
                }
                
                // Quebra de linha a cada 10 movimentos
                if (move.number % 10 === 0) {
                    pgn += '\n';
                }
            }
        });
        
        pgn += ` ${this.rules.getGameResult() || '*'}`;
        
        return pgn;
    }
    
    /**
     * Copia PGN para clipboard
     */
    copyPGNToClipboard() {
        const pgn = this.exportPGN();
        navigator.clipboard.writeText(pgn).then(() => {
            this.showNotification('PGN copiado para clipboard!', 'success');
        }).catch(() => {
            this.showNotification('Erro ao copiar PGN', 'error');
        });
    }
    
    /**
     * Obtém estatísticas do jogo
     */
    getStats() {
        return {
            game: this.rules.getGameStats(),
            ai: this.ai.getStats(),
            moves: this.rules.gameState.moveHistory.length,
            timeElapsed: Math.floor((Date.now() - this.gameState.timers.lastUpdate) / 1000),
            mode: this.gameState.mode
        };
    }
}

// Inicializa o jogo quando a página carrega
if (typeof document !== 'undefined') {
    window.ChessGame = ChessGame;
    
    document.addEventListener('DOMContentLoaded', () => {
        // Inicializa o jogo
        const chessGame = new ChessGame();
        
        // Torna global para debugging
        window.game = chessGame;
        
        console.log('Jogo de Xadrez PvP + IA carregado!');
        console.log('Comandos disponíveis:');
        console.log('- game.newGame(): Novo jogo');
        console.log('- game.setGameMode(mode): Altera modo (pvp, ai-easy, etc)');
        console.log('- game.getStats(): Obtém estatísticas');
        console.log('- game.exportPGN(): Exporta jogo como PGN');
    });
}

// Exporta para Node.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ChessGame;
          }
