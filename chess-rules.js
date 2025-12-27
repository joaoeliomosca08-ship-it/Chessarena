/**
 * SISTEMA DE REGRAS DO XADREZ
 * Implementa todas as regras do jogo: movimento, captura, xeque, roque, en passant, etc.
 */

class ChessRules {
    constructor() {
        this.board = null;
        this.gameState = {
            turn: 'white',
            castlingRights: {
                white: { kingSide: true, queenSide: true },
                black: { kingSide: true, queenSide: true }
            },
            enPassantTarget: null,
            halfMoveClock: 0,
            fullMoveNumber: 1,
            check: false,
            checkmate: false,
            stalemate: false,
            draw: false,
            gameOver: false,
            moveHistory: [],
            capturedPieces: {
                white: [],
                black: []
            },
            repetitionCount: {}
        };
        
        this.pieceTypes = {
            PAWN: 'pawn',
            KNIGHT: 'knight',
            BISHOP: 'bishop',
            ROOK: 'rook',
            QUEEN: 'queen',
            KING: 'king'
        };
        
        this.pieceSymbols = {
            white: {
                pawn: '♙',
                knight: '♘',
                bishop: '♗',
                rook: '♖',
                queen: '♕',
                king: '♔'
            },
            black: {
                pawn: '♟',
                knight: '♞',
                bishop: '♝',
                rook: '♜',
                queen: '♛',
                king: '♚'
            }
        };
        
        this.moveDirections = {
            pawn: {
                white: [[-1, 0], [-2, 0], [-1, -1], [-1, 1]],
                black: [[1, 0], [2, 0], [1, -1], [1, 1]]
            },
            knight: [[-2, -1], [-2, 1], [-1, -2], [-1, 2], [1, -2], [1, 2], [2, -1], [2, 1]],
            bishop: [[-1, -1], [-1, 1], [1, -1], [1, 1]],
            rook: [[-1, 0], [1, 0], [0, -1], [0, 1]],
            queen: [[-1, -1], [-1, 0], [-1, 1], [0, -1], [0, 1], [1, -1], [1, 0], [1, 1]],
            king: [[-1, -1], [-1, 0], [-1, 1], [0, -1], [0, 1], [1, -1], [1, 0], [1, 1]]
        };
        
        this.settings = {
            enPassantEnabled: true,
            castlingEnabled: true,
            pawnDoubleMoveEnabled: true,
            autoQueenPromotion: true,
            fiftyMoveRuleEnabled: true,
            threefoldRepetition: true
        };
        
        this.init();
    }
    
    /**
     * Inicializa o tabuleiro
     */
    init() {
        this.createInitialBoard();
        this.calculateAllLegalMoves();
        console.log('ChessRules inicializado com tabuleiro padrão');
    }
    
    /**
     * Cria o tabuleiro inicial
     */
    createInitialBoard() {
        this.board = Array(8).fill().map(() => Array(8).fill(null));
        
        // Posiciona as peças brancas
        this.board[0][0] = { type: this.pieceTypes.ROOK, color: 'white', hasMoved: false };
        this.board[0][1] = { type: this.pieceTypes.KNIGHT, color: 'white', hasMoved: false };
        this.board[0][2] = { type: this.pieceTypes.BISHOP, color: 'white', hasMoved: false };
        this.board[0][3] = { type: this.pieceTypes.QUEEN, color: 'white', hasMoved: false };
        this.board[0][4] = { type: this.pieceTypes.KING, color: 'white', hasMoved: false };
        this.board[0][5] = { type: this.pieceTypes.BISHOP, color: 'white', hasMoved: false };
        this.board[0][6] = { type: this.pieceTypes.KNIGHT, color: 'white', hasMoved: false };
        this.board[0][7] = { type: this.pieceTypes.ROOK, color: 'white', hasMoved: false };
        
        // Posiciona os peões brancos
        for (let col = 0; col < 8; col++) {
            this.board[1][col] = { type: this.pieceTypes.PAWN, color: 'white', hasMoved: false };
        }
        
        // Posiciona as peças pretas
        this.board[7][0] = { type: this.pieceTypes.ROOK, color: 'black', hasMoved: false };
        this.board[7][1] = { type: this.pieceTypes.KNIGHT, color: 'black', hasMoved: false };
        this.board[7][2] = { type: this.pieceTypes.BISHOP, color: 'black', hasMoved: false };
        this.board[7][3] = { type: this.pieceTypes.QUEEN, color: 'black', hasMoved: false };
        this.board[7][4] = { type: this.pieceTypes.KING, color: 'black', hasMoved: false };
        this.board[7][5] = { type: this.pieceTypes.BISHOP, color: 'black', hasMoved: false };
        this.board[7][6] = { type: this.pieceTypes.KNIGHT, color: 'black', hasMoved: false };
        this.board[7][7] = { type: this.pieceTypes.ROOK, color: 'black', hasMoved: false };
        
        // Posiciona os peões pretos
        for (let col = 0; col < 8; col++) {
            this.board[6][col] = { type: this.pieceTypes.PAWN, color: 'black', hasMoved: false };
        }
    }
    
    /**
     * Retorna o símbolo Unicode para uma peça
     */
    getPieceSymbol(piece) {
        if (!piece) return '';
        return this.pieceSymbols[piece.color][piece.type];
    }
    
    /**
     * Verifica se uma posição está dentro do tabuleiro
     */
    isInBoard(row, col) {
        return row >= 0 && row < 8 && col >= 0 && col < 8;
    }
    
    /**
     * Verifica se uma casa está vazia
     */
    isEmptySquare(row, col) {
        return this.isInBoard(row, col) && this.board[row][col] === null;
    }
    
    /**
     * Verifica se uma casa contém uma peça da cor especificada
     */
    isOpponentPiece(row, col, color) {
        return this.isInBoard(row, col) && 
               this.board[row][col] !== null && 
               this.board[row][col].color !== color;
    }
    
    /**
     * Verifica se uma casa contém uma peça aliada
     */
    isAllyPiece(row, col, color) {
        return this.isInBoard(row, col) && 
               this.board[row][col] !== null && 
               this.board[row][col].color === color;
    }
    
    /**
     * Calcula todos os movimentos legais para o jogador atual
     */
    calculateAllLegalMoves() {
        const legalMoves = [];
        const color = this.gameState.turn;
        
        // Primeiro, encontra todos os movimentos possíveis
        const allPossibleMoves = this.getAllPossibleMoves(color);
        
        // Filtra movimentos que deixariam o próprio rei em xeque
        for (const move of allPossibleMoves) {
            if (this.isMoveLegal(move.from, move.to, color)) {
                legalMoves.push(move);
            }
        }
        
        return legalMoves;
    }
    
    /**
     * Obtém todos os movimentos possíveis (sem verificar xeque próprio)
     */
    getAllPossibleMoves(color) {
        const moves = [];
        
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const piece = this.board[row][col];
                if (piece && piece.color === color) {
                    const pieceMoves = this.getPieceMoves(row, col, piece);
                    pieceMoves.forEach(to => {
                        moves.push({
                            from: { row, col },
                            to: { row: to.row, col: to.col },
                            piece: piece,
                            type: this.getMoveType(piece, row, col, to.row, to.col)
                        });
                    });
                }
            }
        }
        
        return moves;
    }
    
    /**
     * Obtém movimentos possíveis para uma peça específica
     */
    getPieceMoves(row, col, piece) {
        const moves = [];
        
        switch (piece.type) {
            case this.pieceTypes.PAWN:
                moves.push(...this.getPawnMoves(row, col, piece.color));
                break;
            case this.pieceTypes.KNIGHT:
                moves.push(...this.getKnightMoves(row, col, piece.color));
                break;
            case this.pieceTypes.BISHOP:
                moves.push(...this.getSlidingMoves(row, col, piece.color, this.moveDirections.bishop));
                break;
            case this.pieceTypes.ROOK:
                moves.push(...this.getSlidingMoves(row, col, piece.color, this.moveDirections.rook));
                break;
            case this.pieceTypes.QUEEN:
                moves.push(...this.getSlidingMoves(row, col, piece.color, this.moveDirections.queen));
                break;
            case this.pieceTypes.KING:
                moves.push(...this.getKingMoves(row, col, piece.color));
                break;
        }
        
        return moves;
    }
    
    /**
     * Obtém movimentos do peão
     */
    getPawnMoves(row, col, color) {
        const moves = [];
        const direction = color === 'white' ? -1 : 1;
        const startRow = color === 'white' ? 1 : 6;
        
        // Movimento para frente
        if (this.isEmptySquare(row + direction, col)) {
            moves.push({ row: row + direction, col });
            
            // Movimento duplo do primeiro movimento
            if (row === startRow && this.isEmptySquare(row + 2 * direction, col)) {
                moves.push({ row: row + 2 * direction, col });
            }
        }
        
        // Capturas diagonais
        const captureCols = [col - 1, col + 1];
        for (const captureCol of captureCols) {
            if (this.isOpponentPiece(row + direction, captureCol, color)) {
                moves.push({ row: row + direction, col: captureCol });
            }
            
            // En passant
            if (this.settings.enPassantEnabled && this.gameState.enPassantTarget) {
                const epRow = this.gameState.enPassantTarget.row;
                const epCol = this.gameState.enPassantTarget.col;
                
                if (row + direction === epRow && captureCol === epCol) {
                    moves.push({ row: row + direction, col: captureCol, enPassant: true });
                }
            }
        }
        
        return moves;
    }
    
    /**
     * Obtém movimentos do cavalo
     */
    getKnightMoves(row, col, color) {
        const moves = [];
        
        for (const [dr, dc] of this.moveDirections.knight) {
            const newRow = row + dr;
            const newCol = col + dc;
            
            if (this.isInBoard(newRow, newCol) && 
                !this.isAllyPiece(newRow, newCol, color)) {
                moves.push({ row: newRow, col: newCol });
            }
        }
        
        return moves;
    }
    
    /**
     * Obtém movimentos de peças deslizantes (bispo, torre, rainha)
     */
    getSlidingMoves(row, col, color, directions) {
        const moves = [];
        
        for (const [dr, dc] of directions) {
            let currentRow = row + dr;
            let currentCol = col + dc;
            
            while (this.isInBoard(currentRow, currentCol)) {
                if (this.isEmptySquare(currentRow, currentCol)) {
                    moves.push({ row: currentRow, col: currentCol });
                } else if (this.isOpponentPiece(currentRow, currentCol, color)) {
                    moves.push({ row: currentRow, col: currentCol });
                    break;
                } else {
                    break;
                }
                
                currentRow += dr;
                currentCol += dc;
            }
        }
        
        return moves;
    }
    
    /**
     * Obtém movimentos do rei
     */
    getKingMoves(row, col, color) {
        const moves = [];
        
        // Movimentos normais
        for (const [dr, dc] of this.moveDirections.king) {
            const newRow = row + dr;
            const newCol = col + dc;
            
            if (this.isInBoard(newRow, newCol) && 
                !this.isAllyPiece(newRow, newCol, color)) {
                moves.push({ row: newRow, col: newCol });
            }
        }
        
        // Roque
        if (this.settings.castlingEnabled && !piece.hasMoved) {
            moves.push(...this.getCastlingMoves(row, col, color));
        }
        
        return moves;
    }
    
    /**
     * Obtém movimentos de roque
     */
    getCastlingMoves(row, col, color) {
        const moves = [];
        const castlingRights = this.gameState.castlingRights[color];
        
        // Roque curto (lado do rei)
        if (castlingRights.kingSide) {
            const pathClear = this.isCastlingPathClear(row, col, 'kingSide', color);
            const notInCheck = !this.isKingInCheck(color);
            const pathSafe = this.isCastlingPathSafe(row, col, 'kingSide', color);
            
            if (pathClear && notInCheck && pathSafe) {
                moves.push({ 
                    row, 
                    col: col + 2, 
                    castling: 'kingSide',
                    rookFrom: { row, col: 7 },
                    rookTo: { row, col: 5 }
                });
            }
        }
        
        // Roque longo (lado da rainha)
        if (castlingRights.queenSide) {
            const pathClear = this.isCastlingPathClear(row, col, 'queenSide', color);
            const notInCheck = !this.isKingInCheck(color);
            const pathSafe = this.isCastlingPathSafe(row, col, 'queenSide', color);
            
            if (pathClear && notInCheck && pathSafe) {
                moves.push({ 
                    row, 
                    col: col - 2, 
                    castling: 'queenSide',
                    rookFrom: { row, col: 0 },
                    rookTo: { row, col: 3 }
                });
            }
        }
        
        return moves;
    }
    
    /**
     * Verifica se o caminho do roque está livre
     */
    isCastlingPathClear(row, col, side, color) {
        if (side === 'kingSide') {
            // Verifica casas f1 e g1 (branco) ou f8 e g8 (preto)
            return this.isEmptySquare(row, col + 1) && 
                   this.isEmptySquare(row, col + 2);
        } else {
            // Verifica casas d1, c1 e b1 (branco) ou d8, c8 e b8 (preto)
            return this.isEmptySquare(row, col - 1) && 
                   this.isEmptySquare(row, col - 2) && 
                   this.isEmptySquare(row, col - 3);
        }
    }
    
    /**
     * Verifica se o caminho do roque está seguro (não sob ataque)
     */
    isCastlingPathSafe(row, col, side, color) {
        if (side === 'kingSide') {
            // Verifica se as casas que o rei passa não estão sob ataque
            return !this.isSquareAttacked(row, col + 1, color) &&
                   !this.isSquareAttacked(row, col + 2, color);
        } else {
            // Verifica se as casas que o rei passa não estão sob ataque
            return !this.isSquareAttacked(row, col - 1, color) &&
                   !this.isSquareAttacked(row, col - 2, color);
        }
    }
    
    /**
     * Verifica se um movimento é legal (não deixa o rei em xeque)
     */
    isMoveLegal(from, to, color) {
        // Faz uma cópia do tabuleiro para simulação
        const originalBoard = this.cloneBoard();
        const originalState = JSON.parse(JSON.stringify(this.gameState));
        
        // Executa o movimento na cópia
        this.makeMoveOnBoard(from, to, true);
        
        // Verifica se o rei está em xeque após o movimento
        const kingInCheck = this.isKingInCheck(color);
        
        // Restaura o estado original
        this.board = originalBoard;
        this.gameState = originalState;
        
        return !kingInCheck;
    }
    
    /**
     * Verifica se o rei da cor especificada está em xeque
     */
    isKingInCheck(color) {
        const kingPos = this.findKingPosition(color);
        if (!kingPos) return false;
        
        return this.isSquareAttacked(kingPos.row, kingPos.col, color);
    }
    
    /**
     * Encontra a posição do rei
     */
    findKingPosition(color) {
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const piece = this.board[row][col];
                if (piece && piece.type === this.pieceTypes.KING && piece.color === color) {
                    return { row, col };
                }
            }
        }
        return null;
    }
    
    /**
     * Verifica se uma casa está sob ataque
     */
    isSquareAttacked(row, col, defenderColor) {
        const attackerColor = defenderColor === 'white' ? 'black' : 'white';
        
        // Verifica ataques de peões
        const pawnDirection = attackerColor === 'white' ? -1 : 1;
        const pawnAttacks = [[pawnDirection, -1], [pawnDirection, 1]];
        
        for (const [dr, dc] of pawnAttacks) {
            const attackRow = row - dr; // Inverte a direção
            const attackCol = col - dc;
            
            if (this.isInBoard(attackRow, attackCol)) {
                const piece = this.board[attackRow][attackCol];
                if (piece && 
                    piece.color === attackerColor && 
                    piece.type === this.pieceTypes.PAWN) {
                    return true;
                }
            }
        }
        
        // Verifica ataques de cavalos
        for (const [dr, dc] of this.moveDirections.knight) {
            const attackRow = row + dr;
            const attackCol = col + dc;
            
            if (this.isInBoard(attackRow, attackCol)) {
                const piece = this.board[attackRow][attackCol];
                if (piece && 
                    piece.color === attackerColor && 
                    piece.type === this.pieceTypes.KNIGHT) {
                    return true;
                }
            }
        }
        
        // Verifica ataques de bispos, torres e rainhas (peças deslizantes)
        const slidingDirections = [
            ...this.moveDirections.bishop,
            ...this.moveDirections.rook,
            ...this.moveDirections.queen
        ];
        
        for (const [dr, dc] of slidingDirections) {
            let currentRow = row + dr;
            let currentCol = col + dc;
            
            while (this.isInBoard(currentRow, currentCol)) {
                const piece = this.board[currentRow][currentCol];
                
                if (piece) {
                    if (piece.color === attackerColor) {
                        // Verifica se a peça pode atacar nesta direção
                        if ((dr !== 0 && dc !== 0 && (piece.type === this.pieceTypes.BISHOP || piece.type === this.pieceTypes.QUEEN)) ||
                            ((dr === 0 || dc === 0) && (piece.type === this.pieceTypes.ROOK || piece.type === this.pieceTypes.QUEEN))) {
                            return true;
                        }
                    }
                    break; // Peça bloqueando a linha de visão
                }
                
                currentRow += dr;
                currentCol += dc;
            }
        }
        
        // Verifica ataques do rei (para evitar movimento para casa atacada)
        for (const [dr, dc] of this.moveDirections.king) {
            const attackRow = row + dr;
            const attackCol = col + dc;
            
            if (this.isInBoard(attackRow, attackCol)) {
                const piece = this.board[attackRow][attackCol];
                if (piece && 
                    piece.color === attackerColor && 
                    piece.type === this.pieceTypes.KING) {
                    return true;
                }
            }
        }
        
        return false;
    }
    
    /**
     * Determina o tipo de movimento
     */
    getMoveType(piece, fromRow, fromCol, toRow, toCol) {
        if (piece.type === this.pieceTypes.PAWN) {
            // Promoção
            if ((piece.color === 'white' && toRow === 0) || 
                (piece.color === 'black' && toRow === 7)) {
                return 'promotion';
            }
            
            // En passant
            if (this.gameState.enPassantTarget && 
                toRow === this.gameState.enPassantTarget.row && 
                toCol === this.gameState.enPassantTarget.col) {
                return 'enPassant';
            }
            
            // Captura normal
            if (fromCol !== toCol && this.board[toRow][toCol]) {
                return 'capture';
            }
            
            // Movimento duplo
            if (Math.abs(toRow - fromRow) === 2) {
                return 'pawnDouble';
            }
        }
        
        // Roque
        if (piece.type === this.pieceTypes.KING && Math.abs(toCol - fromCol) === 2) {
            return 'castling';
        }
        
        // Captura normal
        if (this.board[toRow][toCol]) {
            return 'capture';
        }
        
        return 'normal';
    }
    
    /**
     * Executa um movimento
     */
    makeMove(from, to, promotionPiece = this.pieceTypes.QUEEN) {
        if (!this.isInBoard(from.row, from.col) || !this.isInBoard(to.row, to.col)) {
            return { success: false, error: 'Posição inválida' };
        }
        
        const piece = this.board[from.row][from.col];
        if (!piece) {
            return { success: false, error: 'Nenhuma peça na posição de origem' };
        }
        
        if (piece.color !== this.gameState.turn) {
            return { success: false, error: 'Não é a vez deste jogador' };
        }
        
        // Verifica se o movimento é legal
        const legalMoves = this.calculateAllLegalMoves();
        const isLegal = legalMoves.some(move => 
            move.from.row === from.row && move.from.col === from.col &&
            move.to.row === to.row && move.to.col === to.col
        );
        
        if (!isLegal) {
            return { success: false, error: 'Movimento ilegal' };
        }
        
        // Cria registro do movimento
        const moveRecord = {
            from: { ...from },
            to: { ...to },
            piece: { ...piece },
            capturedPiece: this.board[to.row][to.col],
            moveType: this.getMoveType(piece, from.row, from.col, to.row, to.col),
            beforeState: JSON.parse(JSON.stringify(this.gameState)),
            timestamp: Date.now()
        };
        
        // Executa o movimento
        this.makeMoveOnBoard(from, to, false, promotionPiece);
        
        // Atualiza estado do jogo
        this.updateGameState(moveRecord);
        
        // Adiciona ao histórico
        this.gameState.moveHistory.push(moveRecord);
        
        return { 
            success: true, 
            moveRecord,
            check: this.gameState.check,
            checkmate: this.gameState.checkmate,
            stalemate: this.gameState.stalemate,
            draw: this.gameState.draw
        };
    }
    
    /**
     * Executa movimento no tabuleiro
     */
    makeMoveOnBoard(from, to, isSimulation = false, promotionPiece = this.pieceTypes.QUEEN) {
        const piece = this.board[from.row][from.col];
        const moveType = this.getMoveType(piece, from.row, from.col, to.row, to.col);
        
        // Move a peça
        this.board[to.row][to.col] = piece;
        this.board[from.row][from.col] = null;
        
        // Marca que a peça se moveu
        if (!isSimulation) {
            piece.hasMoved = true;
        }
        
        // Trata casos especiais
        switch (moveType) {
            case 'enPassant':
                // Remove o peão capturado en passant
                const capturedPawnRow = from.row;
                const capturedPawnCol = to.col;
                if (!isSimulation) {
                    this.gameState.capturedPieces[piece.color === 'white' ? 'white' : 'black']
                        .push(this.board[capturedPawnRow][capturedPawnCol]);
                }
                this.board[capturedPawnRow][capturedPawnCol] = null;
                break;
                
            case 'castling':
                // Move a torre
                const rookFromCol = to.col > from.col ? 7 : 0;
                const rookToCol = to.col > from.col ? 5 : 3;
                const rook = this.board[from.row][rookFromCol];
                this.board[from.row][rookToCol] = rook;
                this.board[from.row][rookFromCol] = null;
                if (rook && !isSimulation) {
                    rook.hasMoved = true;
                }
                break;
                
            case 'promotion':
                // Promove o peão
                if (!isSimulation) {
                    piece.type = promotionPiece;
                }
                break;
                
            case 'capture':
                // Registra peça capturada
                if (!isSimulation && this.board[to.row][to.col]) {
                    this.gameState.capturedPieces[piece.color === 'white' ? 'white' : 'black']
                        .push(this.board[to.row][to.col]);
                }
                break;
        }
    }
    
    /**
     * Atualiza estado do jogo após movimento
     */
    updateGameState(moveRecord) {
        const { piece, to, moveType } = moveRecord;
        
        // Atualiza turno
        this.gameState.turn = this.gameState.turn === 'white' ? 'black' : 'white';
        
        // Atualiza relógio de meio movimento (para regra dos 50 movimentos)
        if (moveType === 'capture' || piece.type === this.pieceTypes.PAWN) {
            this.gameState.halfMoveClock = 0;
        } else {
            this.gameState.halfMoveClock++;
        }
        
        // Atualiza número de movimento completo após jogada das pretas
        if (this.gameState.turn === 'white') {
            this.gameState.fullMoveNumber++;
        }
        
        // Atualiza alvo en passant
        if (moveType === 'pawnDouble') {
            const direction = piece.color === 'white' ? -1 : 1;
            this.gameState.enPassantTarget = {
                row: to.row + direction,
                col: to.col
            };
        } else {
            this.gameState.enPassantTarget = null;
        }
        
        // Atualiza direitos de roque
        this.updateCastlingRights(piece, moveRecord.from);
        
        // Verifica xeque
        const opponentColor = piece.color === 'white' ? 'black' : 'white';
        this.gameState.check = this.isKingInCheck(opponentColor);
        
        // Verifica fim de jogo
        this.checkGameOver();
        
        // Verifica repetição de posição
        this.checkRepetition();
    }
    
    /**
     * Atualiza direitos de roque
     */
    updateCastlingRights(piece, from) {
        const color = piece.color;
        
        if (piece.type === this.pieceTypes.KING) {
            this.gameState.castlingRights[color].kingSide = false;
            this.gameState.castlingRights[color].queenSide = false;
        } else if (piece.type === this.pieceTypes.ROOK) {
            if (from.col === 0) { // Torre da rainha
                this.gameState.castlingRights[color].queenSide = false;
            } else if (from.col === 7) { // Torre do rei
                this.gameState.castlingRights[color].kingSide = false;
            }
        }
    }
    
    /**
     * Verifica condições de fim de jogo
     */
    checkGameOver() {
        const currentColor = this.gameState.turn;
        const legalMoves = this.calculateAllLegalMoves();
        
        // Xeque-mate
        if (this.gameState.check && legalMoves.length === 0) {
            this.gameState.checkmate = true;
            this.gameState.gameOver = true;
            return;
        }
        
        // Afogamento (stalemate)
        if (!this.gameState.check && legalMoves.length === 0) {
            this.gameState.stalemate = true;
            this.gameState.gameOver = true;
            this.gameState.draw = true;
            return;
        }
        
        // Regra dos 50 movimentos
        if (this.settings.fiftyMoveRuleEnabled && this.gameState.halfMoveClock >= 100) {
            this.gameState.draw = true;
            this.gameState.gameOver = true;
            return;
        }
        
        // Material insuficiente
        if (this.hasInsufficientMaterial()) {
            this.gameState.draw = true;
            this.gameState.gameOver = true;
            return;
        }
    }
    
    /**
     * Verifica repetição de posição
     */
    checkRepetition() {
        if (!this.settings.threefoldRepetition) return;
        
        const boardHash = this.getBoardHash();
        this.gameState.repetitionCount[boardHash] = 
            (this.gameState.repetitionCount[boardHash] || 0) + 1;
        
        if (this.gameState.repetitionCount[boardHash] >= 3) {
            this.gameState.draw = true;
            this.gameState.gameOver = true;
        }
    }
    
    /**
     * Gera hash do tabuleiro atual
     */
    getBoardHash() {
        let hash = '';
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const piece = this.board[row][col];
                if (piece) {
                    hash += `${piece.color[0]}${piece.type[0]}${row}${col}`;
                } else {
                    hash += '--';
                }
            }
        }
        hash += this.gameState.turn[0];
        hash += this.gameState.castlingRights.white.kingSide ? '1' : '0';
        hash += this.gameState.castlingRights.white.queenSide ? '1' : '0';
        hash += this.gameState.castlingRights.black.kingSide ? '1' : '0';
        hash += this.gameState.castlingRights.black.queenSide ? '1' : '0';
        hash += this.gameState.enPassantTarget ? '1' : '0';
        
        return hash;
    }
    
    /**
     * Verifica se há material insuficiente para xeque-mate
     */
    hasInsufficientMaterial() {
        let pieceCount = 0;
        let bishops = [];
        let knights = 0;
        
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const piece = this.board[row][col];
                if (piece) {
                    pieceCount++;
                    
                    if (piece.type === this.pieceTypes.QUEEN || 
                        piece.type === this.pieceTypes.ROOK || 
                        piece.type === this.pieceTypes.PAWN) {
                        return false; // Peças que podem dar xeque-mate
                    }
                    
                    if (piece.type === this.pieceTypes.BISHOP) {
                        bishops.push((row + col) % 2); // 0 para casas claras, 1 para escuras
                    }
                    
                    if (piece.type === this.pieceTypes.KNIGHT) {
                        knights++;
                    }
                }
            }
        }
        
        // Casos de material insuficiente:
        // 1. Apenas reis
        if (pieceCount === 2) return true;
        
        // 2. Rei + bispo vs Rei
        // 3. Rei + cavalo vs Rei
        if (pieceCount === 3 && (bishops.length === 1 || knights === 1)) return true;
        
        // 4. Rei + bispo vs Rei + bispo (mesma cor)
        if (pieceCount === 4 && bishops.length === 2) {
            return bishops[0] === bishops[1];
        }
        
        return false;
    }
    
    /**
     * Clona o tabuleiro atual
     */
    cloneBoard() {
        return this.board.map(row => 
            row.map(piece => piece ? { ...piece } : null)
        );
    }
    
    /**
     * Desfaz o último movimento
     */
    undoMove() {
        if (this.gameState.moveHistory.length === 0) {
            return { success: false, error: 'Nenhum movimento para desfazer' };
        }
        
        const lastMove = this.gameState.moveHistory.pop();
        
        // Restaura estado anterior
        this.gameState = lastMove.beforeState;
        
        // Restaura o tabuleiro
        this.board = this.cloneBoard(); // Clona para evitar referências
        
        // Move a peça de volta
        const piece = this.board[lastMove.to.row][lastMove.to.col];
        this.board[lastMove.from.row][lastMove.from.col] = piece;
        this.board[lastMove.to.row][lastMove.to.col] = lastMove.capturedPiece;
        
        // Restaura casos especiais
        if (lastMove.moveType === 'enPassant') {
            const capturedPawnRow = lastMove.from.row;
            const capturedPawnCol = lastMove.to.col;
            const pawnColor = piece.color === 'white' ? 'black' : 'white';
            this.board[capturedPawnRow][capturedPawnCol] = {
                type: this.pieceTypes.PAWN,
                color: pawnColor,
                hasMoved: true
            };
            
            // Remove da lista de capturados
            const capturedArray = this.gameState.capturedPieces[piece.color === 'white' ? 'white' : 'black'];
            capturedArray.pop();
        }
        
        if (lastMove.moveType === 'castling') {
            const rookFromCol = lastMove.to.col > lastMove.from.col ? 5 : 3;
            const rookToCol = lastMove.to.col > lastMove.from.col ? 7 : 0;
            const rook = this.board[lastMove.from.row][rookFromCol];
            this.board[lastMove.from.row][rookToCol] = rook;
            this.board[lastMove.from.row][rookFromCol] = null;
            if (rook) {
                rook.hasMoved = false;
            }
        }
        
        if (lastMove.moveType === 'promotion') {
            piece.type = this.pieceTypes.PAWN;
        }
        
        return { success: true, move: lastMove };
    }
    
    /**
     * Obtém notação algébrica do movimento
     */
    getAlgebraicNotation(move) {
        const { from, to, piece, moveType, capturedPiece } = move;
        const fileFrom = String.fromCharCode(97 + from.col);
        const rankFrom = 8 - from.row;
        const fileTo = String.fromCharCode(97 + to.col);
        const rankTo = 8 - to.row;
        
        let notation = '';
        
        // Peças (exceto peão)
        if (piece.type !== this.pieceTypes.PAWN) {
            const pieceSymbol = piece.type === this.pieceTypes.KNIGHT ? 'N' :
                              piece.type === this.pieceTypes.BISHOP ? 'B' :
                              piece.type === this.pieceTypes.ROOK ? 'R' :
                              piece.type === this.pieceTypes.QUEEN ? 'Q' :
                              piece.type === this.pieceTypes.KING ? 'K' : '';
            notation += pieceSymbol;
        }
        
        // Captura
        if (capturedPiece || moveType === 'enPassant') {
            if (piece.type === this.pieceTypes.PAWN) {
                notation += fileFrom;
            }
            notation += 'x';
        }
        
        // Casa de destino
        notation += fileTo + rankTo;
        
        // Promoção
        if (moveType === 'promotion') {
            const promoPiece = this.board[to.row][to.col];
            const promoSymbol = promoPiece.type === this.pieceTypes.QUEEN ? 'Q' :
                               promoPiece.type === this.pieceTypes.ROOK ? 'R' :
                               promoPiece.type === this.pieceTypes.BISHOP ? 'B' :
                               promoPiece.type === this.pieceTypes.KNIGHT ? 'N' : '';
            notation += '=' + promoSymbol;
        }
        
        // Roque
        if (moveType === 'castling') {
            notation = to.col > from.col ? 'O-O' : 'O-O-O';
        }
        
        // Xeque e xeque-mate
        const opponentColor = piece.color === 'white' ? 'black' : 'white';
        const inCheck = this.isKingInCheck(opponentColor);
        const legalMoves = this.calculateAllLegalMoves();
        
        if (inCheck) {
            if (legalMoves.length === 0) {
                notation += '#';
            } else {
                notation += '+';
            }
        }
        
        return notation;
    }
    
    /**
     * Exporta posição atual em FEN (Forsyth-Edwards Notation)
     */
    exportFEN() {
        let fen = '';
        
        // Posição das peças
        for (let row = 0; row < 8; row++) {
            let emptyCount = 0;
            
            for (let col = 0; col < 8; col++) {
                const piece = this.board[row][col];
                
                if (piece === null) {
                    emptyCount++;
                } else {
                    if (emptyCount > 0) {
                        fen += emptyCount;
                        emptyCount = 0;
                    }
                    
                    const symbol = piece.type === this.pieceTypes.PAWN ? 'P' :
                                  piece.type === this.pieceTypes.KNIGHT ? 'N' :
                                  piece.type === this.pieceTypes.BISHOP ? 'B' :
                                  piece.type === this.pieceTypes.ROOK ? 'R' :
                                  piece.type === this.pieceTypes.QUEEN ? 'Q' :
                                  piece.type === this.pieceTypes.KING ? 'K' : '';
                    
                    fen += piece.color === 'white' ? symbol : symbol.toLowerCase();
                }
            }
            
            if (emptyCount > 0) {
                fen += emptyCount;
            }
            
            if (row < 7) {
                fen += '/';
            }
        }
        
        // Turno
        fen += ' ' + (this.gameState.turn === 'white' ? 'w' : 'b');
        
        // Direitos de roque
        let castling = '';
        if (this.gameState.castlingRights.white.kingSide) castling += 'K';
        if (this.gameState.castlingRights.white.queenSide) castling += 'Q';
        if (this.gameState.castlingRights.black.kingSide) castling += 'k';
        if (this.gameState.castlingRights.black.queenSide) castling += 'q';
        fen += ' ' + (castling || '-');
        
        // Alvo en passant
        const ep = this.gameState.enPassantTarget;
        fen += ' ' + (ep ? String.fromCharCode(97 + ep.col) + (8 - ep.row) : '-');
        
        // Relógio de meio movimento
        fen += ' ' + this.gameState.halfMoveClock;
        
        // Número do movimento completo
        fen += ' ' + this.gameState.fullMoveNumber;
        
        return fen;
    }
    
    /**
     * Carrega posição a partir de FEN
     */
    loadFEN(fen) {
        try {
            const parts = fen.trim().split(/\s+/);
            if (parts.length < 4) throw new Error('FEN inválido');
            
            // Limpa tabuleiro
            this.board = Array(8).fill().map(() => Array(8).fill(null));
            
            // Carrega posição das peças
            const rows = parts[0].split('/');
            for (let row = 0; row < 8; row++) {
                let col = 0;
                for (const char of rows[row]) {
                    if (/[1-8]/.test(char)) {
                        col += parseInt(char);
                    } else {
                        const color = /[A-Z]/.test(char) ? 'white' : 'black';
                        const type = this.getPieceTypeFromSymbol(char.toUpperCase());
                        this.board[row][col] = {
                            type,
                            color,
                            hasMoved: true // Assume que já moveu ao carregar FEN
                        };
                        col++;
                    }
                }
            }
            
            // Turno
            this.gameState.turn = parts[1] === 'w' ? 'white' : 'black';
            
            // Direitos de roque
            this.gameState.castlingRights = {
                white: { kingSide: false, queenSide: false },
                black: { kingSide: false, queenSide: false }
            };
            
            if (parts[2] !== '-') {
                for (const char of parts[2]) {
                    switch (char) {
                        case 'K': this.gameState.castlingRights.white.kingSide = true; break;
                        case 'Q': this.gameState.castlingRights.white.queenSide = true; break;
                        case 'k': this.gameState.castlingRights.black.kingSide = true; break;
                        case 'q': this.gameState.castlingRights.black.queenSide = true; break;
                    }
                }
            }
            
            // Alvo en passant
            this.gameState.enPassantTarget = parts[3] === '-' ? null : {
                row: 8 - parseInt(parts[3][1]),
                col: parts[3].charCodeAt(0) - 97
            };
            
            // Relógio de meio movimento
            this.gameState.halfMoveClock = parseInt(parts[4]) || 0;
            
            // Número do movimento completo
            this.gameState.fullMoveNumber = parseInt(parts[5]) || 1;
            
            // Limpa histórico
            this.gameState.moveHistory = [];
            this.gameState.capturedPieces = { white: [], black: [] };
            this.gameState.repetitionCount = {};
            
            // Recalcula estado
            this.gameState.check = this.isKingInCheck(this.gameState.turn === 'white' ? 'black' : 'white');
            this.checkGameOver();
            
            return { success: true };
        } catch (error) {
            console.error('Erro ao carregar FEN:', error);
            return { success: false, error: error.message };
        }
    }
    
    /**
     * Obtém tipo de peça a partir do símbolo FEN
     */
    getPieceTypeFromSymbol(symbol) {
        switch (symbol) {
            case 'P': return this.pieceTypes.PAWN;
            case 'N': return this.pieceTypes.KNIGHT;
            case 'B': return this.pieceTypes.BISHOP;
            case 'R': return this.pieceTypes.ROOK;
            case 'Q': return this.pieceTypes.QUEEN;
            case 'K': return this.pieceTypes.KING;
            default: return this.pieceTypes.PAWN;
        }
    }
    
    /**
     * Atualiza configurações
     */
    updateSettings(settings) {
        this.settings = { ...this.settings, ...settings };
    }
    
    /**
     * Obtém estatísticas do jogo
     */
    getGameStats() {
        let whitePieces = 0;
        let blackPieces = 0;
        let whiteValue = 0;
        let blackValue = 0;
        
        const pieceValues = {
            [this.pieceTypes.PAWN]: 1,
            [this.pieceTypes.KNIGHT]: 3,
            [this.pieceTypes.BISHOP]: 3,
            [this.pieceTypes.ROOK]: 5,
            [this.pieceTypes.QUEEN]: 9,
            [this.pieceTypes.KING]: 0
        };
        
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const piece = this.board[row][col];
                if (piece) {
                    if (piece.color === 'white') {
                        whitePieces++;
                        whiteValue += pieceValues[piece.type];
                    } else {
                        blackPieces++;
                        blackValue += pieceValues[piece.type];
                    }
                }
            }
        }
        
        return {
            white: { pieces: whitePieces, value: whiteValue },
            black: { pieces: blackPieces, value: blackValue },
            totalPieces: whitePieces + blackPieces,
            moveNumber: this.gameState.fullMoveNumber,
            halfMoveClock: this.gameState.halfMoveClock,
            inCheck: this.gameState.check,
            gameOver: this.gameState.gameOver,
            result: this.getGameResult()
        };
    }
    
    /**
     * Obtém resultado do jogo
     */
    getGameResult() {
        if (!this.gameState.gameOver) return null;
        
        if (this.gameState.checkmate) {
            return this.gameState.turn === 'white' ? '0-1' : '1-0';
        }
        
        if (this.gameState.draw || this.gameState.stalemate) {
            return '1/2-1/2';
        }
        
        return null;
    }
    
    /**
     * Obtém peças capturadas
     */
    getCapturedPieces() {
        return this.gameState.capturedPieces;
    }
    
    /**
     * Obtém histórico de movimentos
     */
    getMoveHistory() {
        return this.gameState.moveHistory.map((move, index) => ({
            number: Math.floor(index / 2) + 1,
            white: index % 2 === 0 ? this.getAlgebraicNotation(move) : null,
            black: index % 2 === 1 ? this.getAlgebraicNotation(move) : null,
            move: move
        }));
    }
    
    /**
     * Reinicia o jogo
     */
    reset() {
        this.init();
        return { success: true };
    }
}

// Exporta a classe para uso global
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ChessRules;
  }
