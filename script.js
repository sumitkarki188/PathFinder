class PathfindingUI {
    constructor() {
        this.rows = 20;
        this.cols = 25;
        this.start = { row: 2, col: 2 };
        this.end = { row: 17, col: 22 };
        this.walls = new Set();
        this.currentMode = 'start';
        
        this.initializeGrid();
        this.setupEventListeners();
    }
    
    initializeGrid() {
        const grid = document.getElementById('grid');
        grid.innerHTML = '';
        
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                const cell = document.createElement('div');
                cell.className = 'cell';
                cell.id = `cell-${row}-${col}`;
                cell.addEventListener('click', () => this.handleCellClick(row, col));
                
                if (row === this.start.row && col === this.start.col) {
                    cell.classList.add('start');
                } else if (row === this.end.row && col === this.end.col) {
                    cell.classList.add('end');
                }
                
                grid.appendChild(cell);
            }
        }
    }
    
    setupEventListeners() {
        document.getElementById('start-mode').addEventListener('click', () => this.setMode('start'));
        document.getElementById('end-mode').addEventListener('click', () => this.setMode('end'));
        document.getElementById('wall-mode').addEventListener('click', () => this.setMode('wall'));
        
        document.getElementById('visualize').addEventListener('click', () => this.runAlgorithm());
        document.getElementById('clear').addEventListener('click', () => this.clearAll());
        
        document.getElementById('algorithm').addEventListener('change', (e) => {
            document.getElementById('current-algo').textContent = 
                e.target.options[e.target.selectedIndex].text;
        });
    }
    
    setMode(mode) {
        this.currentMode = mode;
        document.querySelectorAll('.mode-btn').forEach(btn => btn.classList.remove('active'));
        document.getElementById(`${mode}-mode`).classList.add('active');
    }
    
    handleCellClick(row, col) {
        const cell = document.getElementById(`cell-${row}-${col}`);
        
        if (this.currentMode === 'start') {
            document.querySelector('.start')?.classList.remove('start');
            this.start = { row, col };
            cell.classList.add('start');
            cell.classList.remove('end', 'wall');
            this.walls.delete(`${row},${col}`);
            
        } else if (this.currentMode === 'end') {
            document.querySelector('.end')?.classList.remove('end');
            this.end = { row, col };
            cell.classList.add('end');
            cell.classList.remove('start', 'wall');
            this.walls.delete(`${row},${col}`);
            
        } else if (this.currentMode === 'wall') {
            if (!cell.classList.contains('start') && !cell.classList.contains('end')) {
                if (cell.classList.contains('wall')) {
                    cell.classList.remove('wall');
                    this.walls.delete(`${row},${col}`);
                } else {
                    cell.classList.add('wall');
                    this.walls.add(`${row},${col}`);
                }
            }
        }
    }
    
    // Fixed algorithm execution
    async runAlgorithm() {
        this.clearVisualization();
        
        const algorithm = document.getElementById('algorithm').value;
        const startTime = performance.now();
        
        console.log('Running algorithm:', algorithm);
        console.log('Start:', this.start);
        console.log('End:', this.end);
        console.log('Walls:', Array.from(this.walls));
        
        let result;
        
        switch (algorithm) {
            case 'dijkstra':
                result = this.dijkstra();
                break;
            case 'bfs':
                result = this.bfs();
                break;
            case 'dfs':
                result = this.dfs();
                break;
            case 'bellman':
                result = this.bellmanFord();
                break;
            default:
                result = { visited: [], path: [] };
        }
        
        const endTime = performance.now();
        
        console.log('Algorithm result:', result);
        
        if (result && result.visited && result.visited.length > 0) {
            await this.animateVisualization(result.visited, result.path || []);
        }
        
        document.getElementById('steps').textContent = result.visited ? result.visited.length : 0;
        document.getElementById('path-length').textContent = result.path ? result.path.length : 0;
        document.getElementById('time').textContent = `${(endTime - startTime).toFixed(2)}ms`;
    }
    
    // Dijkstra's Algorithm Implementation
    dijkstra() {
        const visited = [];
        const distances = new Map();
        const previous = new Map();
        const unvisited = new Set();
        
        // Initialize all nodes
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                const key = `${row},${col}`;
                distances.set(key, Infinity);
                previous.set(key, null);
                if (!this.walls.has(key)) {
                    unvisited.add(key);
                }
            }
        }
        
        const startKey = `${this.start.row},${this.start.col}`;
        distances.set(startKey, 0);
        
        while (unvisited.size > 0) {
            // Find unvisited node with minimum distance
            let current = null;
            let minDistance = Infinity;
            
            for (const node of unvisited) {
                if (distances.get(node) < minDistance) {
                    minDistance = distances.get(node);
                    current = node;
                }
            }
            
            if (current === null || distances.get(current) === Infinity) break;
            
            unvisited.delete(current);
            visited.push(current);
            
            const [currentRow, currentCol] = current.split(',').map(Number);
            if (currentRow === this.end.row && currentCol === this.end.col) break;
            
            // Check neighbors
            const neighbors = this.getNeighbors(currentRow, currentCol);
            for (const [row, col] of neighbors) {
                const neighborKey = `${row},${col}`;
                if (unvisited.has(neighborKey)) {
                    const alt = distances.get(current) + 1;
                    if (alt < distances.get(neighborKey)) {
                        distances.set(neighborKey, alt);
                        previous.set(neighborKey, current);
                    }
                }
            }
        }
        
        return {
            visited: visited,
            path: this.reconstructPath(previous)
        };
    }
    
    // BFS Algorithm Implementation
    bfs() {
        const visited = [];
        const queue = [`${this.start.row},${this.start.col}`];
        const visitedSet = new Set([`${this.start.row},${this.start.col}`]);
        const previous = new Map();
        
        while (queue.length > 0) {
            const current = queue.shift();
            visited.push(current);
            
            const [currentRow, currentCol] = current.split(',').map(Number);
            
            if (currentRow === this.end.row && currentCol === this.end.col) {
                break;
            }
            
            const neighbors = this.getNeighbors(currentRow, currentCol);
            for (const [row, col] of neighbors) {
                const neighborKey = `${row},${col}`;
                
                if (!visitedSet.has(neighborKey)) {
                    visitedSet.add(neighborKey);
                    previous.set(neighborKey, current);
                    queue.push(neighborKey);
                }
            }
        }
        
        return {
            visited: visited,
            path: this.reconstructPath(previous)
        };
    }
    
    // DFS Algorithm Implementation
    dfs() {
        const visited = [];
        const stack = [`${this.start.row},${this.start.col}`];
        const visitedSet = new Set();
        const previous = new Map();
        
        while (stack.length > 0) {
            const current = stack.pop();
            
            if (visitedSet.has(current)) continue;
            
            visitedSet.add(current);
            visited.push(current);
            
            const [currentRow, currentCol] = current.split(',').map(Number);
            
            if (currentRow === this.end.row && currentCol === this.end.col) {
                break;
            }
            
            const neighbors = this.getNeighbors(currentRow, currentCol);
            // Reverse neighbors for proper DFS ordering
            for (let i = neighbors.length - 1; i >= 0; i--) {
                const [row, col] = neighbors[i];
                const neighborKey = `${row},${col}`;
                
                if (!visitedSet.has(neighborKey)) {
                    if (!previous.has(neighborKey)) {
                        previous.set(neighborKey, current);
                    }
                    stack.push(neighborKey);
                }
            }
        }
        
        return {
            visited: visited,
            path: this.reconstructPath(previous)
        };
    }
    
    // Bellman-Ford Algorithm Implementation
    bellmanFord() {
        const visited = [];
        const distances = new Map();
        const previous = new Map();
        const edges = [];
        
        // Initialize distances
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                const key = `${row},${col}`;
                if (!this.walls.has(key)) {
                    distances.set(key, Infinity);
                    previous.set(key, null);
                }
            }
        }
        
        distances.set(`${this.start.row},${this.start.col}`, 0);
        
        // Create edges
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                const fromKey = `${row},${col}`;
                if (this.walls.has(fromKey)) continue;
                
                const neighbors = this.getNeighbors(row, col);
                for (const [nRow, nCol] of neighbors) {
                    edges.push({
                        from: fromKey,
                        to: `${nRow},${nCol}`,
                        weight: 1
                    });
                }
            }
        }
        
        // Relax edges V-1 times
        const nodeCount = distances.size;
        for (let i = 0; i < nodeCount - 1; i++) {
            let updated = false;
            
            for (const edge of edges) {
                const distFrom = distances.get(edge.from);
                const distTo = distances.get(edge.to);
                
                if (distFrom !== Infinity && distFrom + edge.weight < distTo) {
                    distances.set(edge.to, distFrom + edge.weight);
                    previous.set(edge.to, edge.from);
                    updated = true;
                }
            }
            
            if (!updated) break;
        }
        
        // Create visited array in order of distance
        const sortedNodes = Array.from(distances.entries())
            .filter(([node, dist]) => dist !== Infinity)
            .sort((a, b) => a[1] - b[1])
            .map(([node]) => node);
        
        return {
            visited: sortedNodes,
            path: this.reconstructPath(previous)
        };
    }
    
    getNeighbors(row, col) {
        const neighbors = [];
        const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]];
        
        for (const [dr, dc] of directions) {
            const newRow = row + dr;
            const newCol = col + dc;
            
            if (newRow >= 0 && newRow < this.rows && 
                newCol >= 0 && newCol < this.cols &&
                !this.walls.has(`${newRow},${newCol}`)) {
                neighbors.push([newRow, newCol]);
            }
        }
        
        return neighbors;
    }
    
    reconstructPath(previous) {
        const path = [];
        let current = `${this.end.row},${this.end.col}`;
        
        // Build path backwards
        while (current !== null && current !== undefined) {
            path.unshift(current);
            current = previous.get(current);
        }
        
        // Check if we reached the start
        if (path.length > 0 && path[0] === `${this.start.row},${this.start.col}`) {
            return path;
        }
        
        return []; // No valid path found
    }
    
    async animateVisualization(visitedNodes, pathNodes) {
        console.log('Animating visited nodes:', visitedNodes.length);
        console.log('Animating path nodes:', pathNodes.length);
        
        // Animate visited nodes
        for (let i = 0; i < visitedNodes.length; i++) {
            const node = visitedNodes[i];
            const [row, col] = node.split(',').map(Number);
            const cell = document.getElementById(`cell-${row}-${col}`);
            
            if (cell && !cell.classList.contains('start') && !cell.classList.contains('end')) {
                cell.classList.add('visited');
                await this.sleep(20);
            }
        }
        
        // Small pause before showing path
        await this.sleep(500);
        
        // Animate path
        for (let i = 0; i < pathNodes.length; i++) {
            const node = pathNodes[i];
            const [row, col] = node.split(',').map(Number);
            const cell = document.getElementById(`cell-${row}-${col}`);
            
            if (cell && !cell.classList.contains('start') && !cell.classList.contains('end')) {
                cell.classList.add('path');
                await this.sleep(80);
            }
        }
    }
    
    clearVisualization() {
        document.querySelectorAll('.visited, .path').forEach(cell => {
            cell.classList.remove('visited', 'path');
        });
        
        // Reset stats
        document.getElementById('steps').textContent = '0';
        document.getElementById('path-length').textContent = '0';
        document.getElementById('time').textContent = '0ms';
    }
    
    clearAll() {
        this.walls.clear();
        document.querySelectorAll('.cell').forEach(cell => {
            cell.classList.remove('visited', 'path', 'wall');
        });
        
        this.clearVisualization();
    }
    
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', () => {
    new PathfindingUI();
});
