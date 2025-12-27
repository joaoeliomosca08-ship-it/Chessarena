/**
 * SISTEMA DE IA PARA XADREZ
 * Implementa 5 níveis de dificuldade com Stockfish.js
 */

class ChessAI {
    constructor() {
        this.levels = {
            'easy': { depth: 1, skill: 0, time: 1000, name: 'Fácil' },
            'medium': { depth: 3, skill: 10, time: 2000, name: 'Média' },
            'hard': { depth: 5, skill: 15, time: 3000, name: 'Difícil' },
            'expert': { depth: 10, skill: 20, time: 5000, name: 'Avançada' },
            'master': { depth: 15, skill: 20, time: 8000, name: 'Super Avançada' }
        };
        
        this.currentLevel = 'medium';
        this.stockfish = null;
        this.isInitialized = false;
        this.isThinking = false;
        this.moveCallback = null;
        this.analysisCallback = null;
        this.evaluation = null;
        this.bestLine = [];
        this.pondering = false;
        
        // Cache para posições já avaliadas
        this.positionCache = new Map();
        this.cacheHits = 0;
        this.cacheMisses = 0;
        
        // Métricas de desempenho
        this.metrics = {
            totalMoves: 0,
            averageTime: 0,
            totalTime: 0,
            strongestMoveRate: 0,
            mistakes: 0
        };
        
        this.init();
    }
    
    /**
     * Inicializa o motor de IA
     */
    async init() {
        try {
            console.log('Inicializando ChessAI...');
            
            // Tenta carregar Stockfish.js
            if (typeof Stockfish === 'undefined') {
                console.warn('Stockfish não encontrado, carregando via CDN...');
                await this.loadStockfishFromCDN();
            }
            
            this.stockfish = typeof Stockfish === 'function' ? Stockfish() : new Worker('stockfish.js');
            
            // Configura handlers de mensagens
            this.stockfish.onmessage = this.handleStockfishMessage.bind(this);
            
            // Configura parâmetros iniciais
            this.sendCommand('uci');
            this.sendCommand('setoption name Skill Level value 20');
            this.sendCommand('setoption name Contempt value 24');
            this.sendCommand('setoption name Threads value 2');
            this.sendCommand('setoption name Hash value 128');
            this.sendCommand('setoption name Ponder value false');
            
            this.isInitialized = true;
            console.log('ChessAI inicializado com sucesso');
            
        } catch (error) {
            console.error('Erro ao inicializar ChessAI:', error);
            this.isInitialized = false;
            this.fallbackToSimpleAI();
        }
    }
    
    /**
     * Carrega Stockfish via CDN
     */
    async loadStockfishFromCDN() {
        return new Promise((resolve, reject) => {
            if (typeof Stockfish !== 'undefined') {
                resolve();
                return;
            }
            
            const script = document.createElement('script');
            script.src = 'https://cdnjs.cloudflare.com/ajax/libs/stockfish.js/10.0.2/stockfish.js';
            script.integrity = 'sha256-tpPpL0QoQlVl8+dd8IJrJx8c5M5khVE1Dx8p5GF8VTs=';
            script.crossOrigin = 'anonymous';
            
            script.onload = () => {
                console.log('Stockfish carregado via CDN');
                resolve();
            };
            
            script.onerror = (error) => {
                console.error('Erro ao carregar Stockfish:', error);
                reject(error);
            };
            
            document.head.appendChild(script);
        });
    }
    
    /**
     * Fallback para IA simples se Stockfish falhar
     */
    fallbackToSimpleAI() {
        console.log('Usando IA simples como fallback');
        this.stockfish = {
            postMessage: () => {},
            onmessage: null,
            terminate: () => {}
        };
        
        this.isInitialized = true;
    }
    
    /**
     * Manipula mensagens do Stockfish
     */
    handleStockfishMessage(event) {
        const message = event.data || event;
        
        if (message.startsWith('bestmove')) {
            this.handleBestMove(message);
        } else if (message.startsWith('info') && message.includes('score cp')) {
            this.handleEvaluation(message);
        } else if (message.startsWith('info') && message.includes('pv')) {
            this.handlePrincipalVariation(message);
        }
    }
    
    /**
     * Processa o melhor movimento encontrado
     */
    handleBestMove(message) {
        if (!this.isThinking) return;
        
        this.isThinking = false;
        const parts = message.split(' ');
        const bestMove = parts[1];
        
        if (bestMove && bestMove !== '(none)') {
            console.log(`IA escolheu: ${bestMove}`);
            
            // Converte notação UCI para coordenadas do tabuleiro
            const move = this.uciToMove(bestMove);
            
            // Atualiza métricas
            this.metrics.totalMoves++;
            
            // Chama callback com o movimento
            if (this.moveCallback && typeof this.moveCallback === 'function') {
                this.moveCallback(move);
            }
            
            // Limpa callbacks
            this.moveCallback = null;
            this.analysisCallback = null;
        }
    }
    
    /**
     * Processa avaliação da posição
     */
    handleEvaluation(message) {
        // Extrai avaliação (centipawns)
        const cpMatch = message.match(/score cp (-?\d+)/);
        const mateMatch = message.match(/score mate (-?\d+)/);
        
        if (cpMatch) {
            this.evaluation = parseInt(cpMatch[1]) / 100; // Converte para peões
        } else if (mateMatch) {
            const mateIn = parseInt(mateMatch[1]);
            this.evaluation = mateIn > 0 ? `Mate in ${mateIn}` : `Mated in ${-mateIn}`;
        }
        
        // Extrai profundidade
        const depthMatch = message.match(/depth (\d+)/);
        if (depthMatch) {
            const depth = parseInt(depthMatch[1]);
            
            // Notifica análise se houver callback
            if (this.analysisCallback && typeof this.analysisCallback === 'function') {
                this.analysisCallback({
                    evaluation: this.evaluation,
                    depth: depth,
                    message: message
                });
            }
        }
    }
    
    /**
     * Processa variação principal
     */
    handlePrincipalVariation(message) {
        const pvMatch = message.match(/pv ([a-h1-8\s]+)/);
        if (pvMatch) {
            const moves = pvMatch[1].split(' ');
            this.bestLine = moves.slice(0, 5); // Mantém apenas os primeiros 5 movimentos
        }
    }
    
    /**
     * Converte notação UCI para movimento do tabuleiro
     */
    uciToMove(uci) {
        if (uci.length < 4) return null;
        
        const fromCol = uci.charCodeAt(0) - 97;
        const fromRow = 8 - parseInt(uci[1]);
        const toCol = uci.charCodeAt(2) - 97;
        const toRow = 8 - parseInt(uci[3]);
        const promotion = uci.length > 4 ? uci[4] : null;
        
        return {
            from: { row: fromRow, col: fromCol },
            to: { row: toRow, col: toCol },
            promotion: promotion
        };
    }
    
    /**
     * Converte movimento para notação UCI
     */
    moveToUci(move) {
        const fromFile = String.fromCharCode(97 + move.from.col);
        const fromRank = 8 - move.from.row;
        const toFile = String.fromCharCode(97 + move.to.col);
        const toRank = 8 - move.to.row;
        
        let uci = `${fromFile}${fromRank}${toFile}${toRank}`;
        
        if (move.promotion) {
            uci += move.promotion.toLowerCase();
        }
        
        return uci;
    }
    
    /**
     * Envia comando para o Stockfish
     */
    sendCommand(command) {
        if (this.stockfish && this.stockfish.postMessage) {
            this.stockfish.postMessage(command);
        }
    }
    
    /**
     * Define o nível de dificuldade
     */
    setLevel(level) {
        if (this.levels[level]) {
            this.currentLevel = level;
            const config = this.levels[level];
            
            // Configura Stockfish para o nível
            this.sendCommand(`setoption name Skill Level value ${config.skill}`);
            
            console.log(`Nível de IA alterado para: ${config.name}`);
            return true;
        }
        
        console.warn(`Nível ${level} não encontrado, usando médio como padrão`);
        this.currentLevel = 'medium';
        return false;
    }
    
    /**
     * Calcula o melhor movimento para uma posição
     */
    async getBestMove(fen, callback, analysisCallback = null) {
        if (!this.isInitialized) {
            console.warn('IA não inicializada, usando movimento aleatório');
            const randomMove = this.getRandomMove(fen);
            if (callback) callback(randomMove);
            return;
        }
        
        if (this.isThinking) {
            console.warn('IA já está pensando...');
            return;
        }
        
        this.isThinking = true;
        this.moveCallback = callback;
        this.analysisCallback = analysisCallback;
        this.evaluation = null;
        this.bestLine = [];
        
        const levelConfig = this.levels[this.currentLevel];
        const startTime = Date.now();
        
        // Verifica cache primeiro
        const cacheKey = `${fen}|${this.currentLevel}`;
        if (this.positionCache.has(cacheKey)) {
            this.cacheHits++;
            const cached = this.positionCache.get(cacheKey);
            
            // Simula tempo de processamento
            setTimeout(() => {
                if (callback) callback(cached.move);
                this.isThinking = false;
            }, Math.min(levelConfig.time / 2, 500));
            
            console.log(`Movimento do cache (hits: ${this.cacheHits}, misses: ${this.cacheMisses})`);
            return;
        }
        
        this.cacheMisses++;
        
        // Configura a posição
        this.sendCommand(`position fen ${fen}`);
        
        // Configura parâmetros de busca
        let goCommand = `go depth ${levelConfig.depth}`;
        
        // Para níveis mais altos, usa tempo limite também
        if (this.currentLevel === 'expert' || this.currentLevel === 'master') {
            goCommand = `go movetime ${levelConfig.time}`;
        }
        
        // Inicia a busca
        this.sendCommand(goCommand);
        
        // Timeout de segurança
        setTimeout(() => {
            if (this.isThinking) {
                console.warn(`Timeout na IA (nível: ${this.currentLevel})`);
                this.stopThinking();
                
                // Fallback para movimento aleatório
                const randomMove = this.getRandomMove(fen);
                if (callback) callback(randomMove);
            }
        }, levelConfig.time + 2000);
        
        // Registra métricas de tempo
        const thinkingTime = Date.now() - startTime;
        this.metrics.totalTime += thinkingTime;
        this.metrics.averageTime = this.metrics.totalTime / this.metrics.totalMoves;
        
        console.log(`IA pensando (nível: ${levelConfig.name}, tempo: ${thinkingTime}ms)`);
    }
    
    /**
     * Para o pensamento atual
     */
    stopThinking() {
        if (this.isThinking) {
            this.sendCommand('stop');
            this.isThinking = false;
            this.moveCallback = null;
            this.analysisCallback = null;
            console.log('Pensamento da IA interrompido');
        }
    }
    
    /**
     * Obtém um movimento aleatório (fallback)
     */
    getRandomMove(fen) {
        try {
            // Cria um tabuleiro temporário para gerar movimentos legais
            const tempChess = new ChessRules();
            const result = tempChess.loadFEN(fen);
            
            if (!result.success) {
                throw new Error('FEN inválido');
            }
            
            const legalMoves = tempChess.calculateAllLegalMoves();
            
            if (legalMoves.length === 0) {
                return null;
            }
            
            // Escolhe movimento aleatório
            const randomIndex = Math.floor(Math.random() * legalMoves.length);
            const randomMove = legalMoves[randomIndex];
            
            // Para níveis fáceis, às vezes faz movimentos subótimos
            if (this.currentLevel === 'easy' && Math.random() < 0.3) {
                // Escolhe um movimento não ótimo
                const suboptimalIndex = Math.min(randomIndex + 1, legalMoves.length - 1);
                return legalMoves[suboptimalIndex];
            }
            
            return randomMove;
            
        } catch (error) {
            console.error('Erro ao gerar movimento aleatório:', error);
            return null;
        }
    }
    
    /**
     * Avalia uma posição sem fazer movimento
     */
    async evaluatePosition(fen, callback) {
        if (!this.isInitialized) {
            if (callback) callback({ evaluation: 0, bestMove: null });
            return;
        }
        
        this.sendCommand(`position fen ${fen}`);
        this.sendCommand(`go depth 8`);
        
        // Configura handler temporário
        const tempCallback = (message) => {
            if (message && message.includes('bestmove')) {
                const parts = message.split(' ');
                const bestMove = parts[1];
                
                if (callback) {
                    callback({
                        evaluation: this.evaluation,
                        bestMove: bestMove,
                        bestLine: this.bestLine
                    });
                }
            }
        };
        
        this.stockfish.onmessage = tempCallback;
        
        // Timeout
        setTimeout(() => {
            this.stockfish.onmessage = this.handleStockfishMessage.bind(this);
            if (callback) {
                callback({
                    evaluation: this.evaluation || 0,
                    bestMove: null,
                    bestLine: []
                });
            }
        }, 2000);
    }
    
    /**
     * Analisa uma posição em profundidade
     */
    async analyzePosition(fen, depth = 15) {
        return new Promise((resolve) => {
            if (!this.isInitialized) {
                resolve({ evaluation: 0, bestMove: null, pv: [] });
                return;
            }
            
            let analysisResult = {
                evaluation: 0,
                bestMove: null,
                pv: [],
                depth: depth
            };
            
            const analysisCallback = (data) => {
                if (data.evaluation) analysisResult.evaluation = data.evaluation;
                if (data.depth) analysisResult.depth = data.depth;
            };
            
            this.sendCommand(`position fen ${fen}`);
            this.sendCommand(`go depth ${depth}`);
            
            const handler = (message) => {
                if (message.startsWith('bestmove')) {
                    const parts = message.split(' ');
                    analysisResult.bestMove = parts[1];
                    analysisResult.pv = this.bestLine;
                    
                    this.stockfish.onmessage = this.handleStockfishMessage.bind(this);
                    resolve(analysisResult);
                }
            };
            
            this.stockfish.onmessage = handler;
            
            // Timeout
            setTimeout(() => {
                this.stockfish.onmessage = this.handleStockfishMessage.bind(this);
                resolve(analysisResult);
            }, 10000);
        });
    }
    
    /**
     * Obtém uma dica para a posição atual
     */
    async getHint(fen, playerColor) {
        return new Promise((resolve) => {
            if (!this.isInitialized) {
                resolve(null);
                return;
            }
            
            this.sendCommand(`position fen ${fen}`);
            this.sendCommand(`go depth 10`);
            
            const handler = (message) => {
                if (message.startsWith('bestmove')) {
                    const parts = message.split(' ');
                    const bestMoveUCI = parts[1];
                    const bestMove = this.uciToMove(bestMoveUCI);
                    
                    // Verifica se o movimento é para a cor do jogador
                    const position = this.parseFEN(fen);
                    const currentTurn = position.turn;
                    
                    if (currentTurn === playerColor) {
                        resolve(bestMove);
                    } else {
                        // Se não for a vez do jogador, sugere uma resposta para o oponente
                        resolve(bestMove);
                    }
                    
                    this.stockfish.onmessage = this.handleStockfishMessage.bind(this);
                }
            };
            
            this.stockfish.onmessage = handler;
            
            // Timeout
            setTimeout(() => {
                this.stockfish.onmessage = this.handleStockfishMessage.bind(this);
                resolve(null);
            }, 3000);
        });
    }
    
    /**
     * Analisa um jogo completo
     */
    async analyzeGame(gameMoves, initialFen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1') {
        const analysis = [];
        let currentFen = initialFen;
        
        for (let i = 0; i < gameMoves.length; i++) {
            const move = gameMoves[i];
            
            // Analisa a posição antes do movimento
            const positionAnalysis = await this.analyzePosition(currentFen, 12);
            
            analysis.push({
                moveNumber: Math.floor(i / 2) + 1,
                move: move,
                fen: currentFen,
                evaluation: positionAnalysis.evaluation,
                bestMove: positionAnalysis.bestMove,
                isBest: this.moveToUci(move) === positionAnalysis.bestMove,
                pv: positionAnalysis.pv
            });
            
            // Atualiza FEN para próxima posição
            const tempChess = new ChessRules();
            tempChess.loadFEN(currentFen);
            tempChess.makeMove(move.from, move.to);
            currentFen = tempChess.exportFEN();
        }
        
        return analysis;
    }
    
    /**
     * Obtém o nível atual
     */
    getCurrentLevel() {
        return this.levels[this.currentLevel];
    }
    
    /**
     * Obtém todos os níveis disponíveis
     */
    getAllLevels() {
        return this.levels;
    }
    
    /**
     * Atualiza configurações da IA
     */
    updateSettings(settings) {
        if (settings.skillLevel !== undefined) {
            this.sendCommand(`setoption name Skill Level value ${settings.skillLevel}`);
        }
        
        if (settings.hashSize !== undefined) {
            this.sendCommand(`setoption name Hash value ${settings.hashSize}`);
        }
        
        if (settings.threads !== undefined) {
            this.sendCommand(`setoption name Threads value ${settings.threads}`);
        }
        
        if (settings.contempt !== undefined) {
            this.sendCommand(`setoption name Contempt value ${settings.contempt}`);
        }
    }
    
    /**
     * Limpa o cache de posições
     */
    clearCache() {
        this.positionCache.clear();
        this.cacheHits = 0;
        this.cacheMisses = 0;
        console.log('Cache da IA limpo');
    }
    
    /**
     * Obtém estatísticas da IA
     */
    getStats() {
        return {
            ...this.metrics,
            cacheHits: this.cacheHits,
            cacheMisses: this.cacheMisses,
            cacheHitRate: this.cacheHits / (this.cacheHits + this.cacheMisses) || 0,
            currentLevel: this.currentLevel,
            isInitialized: this.isInitialized,
            isThinking: this.isThinking
        };
    }
    
    /**
     * Limpa recursos
     */
    cleanup() {
        this.stopThinking();
        
        if (this.stockfish && this.stockfish.terminate) {
            this.stockfish.terminate();
        }
        
        this.isInitialized = false;
        console.log('ChessAI limpo');
    }
    
    /**
     * Parses FEN para obter informações básicas
     */
    parseFEN(fen) {
        const parts = fen.split(' ');
        return {
            position: parts[0],
            turn: parts[1] === 'w' ? 'white' : 'black',
            castling: parts[2],
            enPassant: parts[3],
            halfMove: parseInt(parts[4]),
            fullMove: parseInt(parts[5])
        };
    }
    
    /**
     * IA simples baseada em regras (sem Stockfish)
     */
    simpleAI(fen, difficulty = 'medium') {
        try {
            const chess = new ChessRules();
            chess.loadFEN(fen);
            
            const legalMoves = chess.calculateAllLegalMoves();
            if (legalMoves.length === 0) return null;
            
            // Avalia cada movimento
            const evaluatedMoves = legalMoves.map(move => ({
                move: move,
                score: this.evaluateMove(move, chess, difficulty)
            }));
            
            // Ordena por pontuação
            evaluatedMoves.sort((a, b) => b.score - a.score);
            
            // Escolhe movimento baseado na dificuldade
            let chosenIndex = 0;
            
            switch(difficulty) {
                case 'easy':
                    // 70% chance de escolher um movimento não ótimo
                    if (Math.random() < 0.7) {
                        chosenIndex = Math.min(evaluatedMoves.length - 1, 
                            Math.floor(Math.random() * evaluatedMoves.length / 2) + 1);
                    }
                    break;
                    
                case 'medium':
                    // 30% chance de erro
                    if (Math.random() < 0.3) {
                        chosenIndex = Math.min(evaluatedMoves.length - 1, 
                            Math.floor(Math.random() * evaluatedMoves.length / 3) + 1);
                    }
                    break;
                    
                case 'hard':
                    // 10% chance de erro
                    if (Math.random() < 0.1) {
                        chosenIndex = Math.min(evaluatedMoves.length - 1, 
                            Math.floor(Math.random() * evaluatedMoves.length / 5) + 1);
                    }
                    break;
                    
                default:
                    // Expert e Master sempre escolhem o melhor
                    chosenIndex = 0;
            }
            
            return evaluatedMoves[chosenIndex].move;
            
        } catch (error) {
            console.error('Erro na IA simples:', error);
            return null;
        }
    }
    
    /**
     * Avalia um movimento para a IA simples
     */
    evaluateMove(move, chess, difficulty) {
        let score = 0;
        
        // Valores das peças
        const pieceValues = {
            'pawn': 100,
            'knight': 320,
            'bishop': 330,
            'rook': 500,
            'queen': 900,
            'king': 20000
        };
        
        // Bonus de posição (tabelas simplificadas)
        const positionBonus = {
            'pawn': [
                [0, 0, 0, 0, 0, 0, 0, 0],
                [50, 50, 50, 50, 50, 50, 50, 50],
                [10, 10, 20, 30, 30, 20, 10, 10],
                [5, 5, 10, 25, 25, 10, 5, 5],
                [0, 0, 0, 20, 20, 0, 0, 0],
                [5, -5, -10, 0, 0, -10, -5, 5],
                [5, 10, 10, -20, -20, 10, 10, 5],
                [0, 0, 0, 0, 0, 0, 0, 0]
            ],
            'knight': [
                [-50, -40, -30, -30, -30, -30, -40, -50],
                [-40, -20, 0, 0, 0, 0, -20, -40],
                [-30, 0, 10, 15, 15, 10, 0, -30],
                [-30, 5, 15, 20, 20, 15, 5, -30],
                [-30, 0, 15, 20, 20, 15, 0, -30],
                [-30, 5, 10, 15, 15, 10, 5, -30],
                [-40, -20, 0, 5, 5, 0, -20, -40],
                [-50, -40, -30, -30, -30, -30, -40, -50]
            ]
        };
        
        // Valor material da captura
        if (move.type === 'capture' || move.type === 'enPassant') {
            const targetPiece = chess.board[move.to.row][move.to.col];
            if (targetPiece) {
                const attackerValue = pieceValues[move.piece.type];
                const defenderValue = pieceValues[targetPiece.type];
                
                // Ganho de material (defensor - atacante, se positivo)
                if (defenderValue > attackerValue) {
                    score += defenderValue - attackerValue;
                }
                
                // Bonus por capturar peça valiosa
                score += defenderValue * 0.1;
            }
        }
        
        // Penalidade por colocar peça em casa atacada
        if (chess.isSquareAttacked(move.to.row, move.to.col, move.piece.color)) {
            score -= pieceValues[move.piece.type] * 0.05;
        }
        
        // Bonus por desenvolvimento (primeiras jogadas)
        if (chess.gameState.fullMoveNumber < 10 && !move.piece.hasMoved) {
            score += 20;
        }
        
        // Bonus por controle do centro
        const isCenter = (move.to.row >= 3 && move.to.row <= 4) && 
                        (move.to.col >= 3 && move.to.col <= 4);
        if (isCenter) {
            score += 15;
        }
        
        // Bonus por xeque
        const tempChess = new ChessRules();
        tempChess.loadFEN(chess.exportFEN());
        tempChess.makeMove(move.from, move.to);
        if (tempChess.gameState.check) {
            score += 50;
        }
        
        // Bonus por ameaças múltiplas
        const threats = this.countThreats(move, chess);
        score += threats * 10;
        
        // Penalidade por bloquear peças próprias
        const mobilityAfter = this.calculateMobility(move, chess);
        score += mobilityAfter * 0.5;
        
        // Ajusta baseado na dificuldade
        switch(difficulty) {
            case 'easy':
                score += (Math.random() - 0.5) * 200; // Mais aleatório
                break;
            case 'medium':
                score += (Math.random() - 0.3) * 100;
                break;
            case 'hard':
                score += (Math.random() - 0.1) * 50;
                break;
            case 'expert':
            case 'master':
                // Menos aleatoriedade
                score += (Math.random() - 0.05) * 20;
                break;
        }
        
        return score;
    }
    
    /**
     * Conta ameaças criadas por um movimento
     */
    countThreats(move, chess) {
        let threats = 0;
        
        // Simula o movimento
        const tempChess = new ChessRules();
        tempChess.loadFEN(chess.exportFEN());
        tempChess.makeMove(move.from, move.to);
        
        // Conta peças ameaçadas
        const color = tempChess.gameState.turn;
        const opponentColor = color === 'white' ? 'black' : 'white';
        
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const piece = tempChess.board[row][col];
                if (piece && piece.color === opponentColor) {
                    if (tempChess.isSquareAttacked(row, col, opponentColor)) {
                        threats++;
                    }
                }
            }
        }
        
        return threats;
    }
    
    /**
     * Calcula mobilidade após movimento
     */
    calculateMobility(move, chess) {
        // Simula o movimento
        const tempChess = new ChessRules();
        tempChess.loadFEN(chess.exportFEN());
        tempChess.makeMove(move.from, move.to);
        
        // Calcula mobilidade (número de movimentos legais)
        const legalMoves = tempChess.calculateAllLegalMoves();
        return legalMoves.length;
    }
    
    /**
     * Verifica se a IA está disponível
     */
    isAvailable() {
        return this.isInitialized;
    }
    
    /**
     * Obtém informações sobre o motor
     */
    getEngineInfo() {
        return {
            name: 'Stockfish.js + IA Simplificada',
            version: '1.0.0',
            author: 'Xadrez PvP',
            maxDepth: 20,
            maxThreads: 2,
            maxHash: 128,
            supportedFeatures: ['UCI', 'Multi-PV', 'Analysis', 'Hint'],
            fallbackAI: true
        };
    }
}

// Exporta a classe
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ChessAI;
}
