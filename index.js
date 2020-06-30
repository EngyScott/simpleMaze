const { Engine, Render, Runner, World, Bodies, Body, Events } = Matter;
const cellsVertic = 20;
const cellsHorize = 15;
const width = window.innerWidth;
const height = window.innerHeight;
const unitLength = height / cellsVertic;
const unitWidth = width / cellsHorize;
const engine = Engine.create();
engine.world.gravity.y = 0;
const { world } = engine;
const render = Render.create({
    element: document.body,
    engine: engine,
    options: {
        width,
        height,
        wireframes: false
    }
});
Render.run(render);
Runner.run(Runner.create(), engine);

//WALLS
const walls = [
    //UP
    Bodies.rectangle(.5*width, 0, width, 2, {isStatic: true}),
    //DOWN
    Bodies.rectangle(.5*width, height, width, 2, {isStatic: true}),
    //LEFT
    Bodies.rectangle(0, .5*height, 2, height, {isStatic: true}),
    //RIGHT
    Bodies.rectangle(width, .5*height, 2, height, {isStatic: true})
]
World.add(world, walls);

////// MAZE GENERATION

const shuffle = (arr)=>{
    let counter = arr.length;
    while(counter > 0){
        const index = Math.floor(Math.random() * counter);
        counter --;
        const temp = arr[counter];
        arr[counter] = arr[index];
        arr[index] = temp;
    }
    return arr;
}

const grid = Array(cellsVertic)
.fill(null)
.map(()=>
    Array(cellsHorize).fill(false)
);

//VERTICAL ARRAY
const verticals = Array(cellsVertic)
.fill(null)
.map(()=>Array(cellsHorize-1).fill(false));

//HORIZONTAL ARRAY
const horize = Array(cellsVertic-1)
.fill(null)
.map(()=>Array(cellsHorize).fill(false))

const startRow = Math.floor(Math.random() * cellsVertic);
const startCol = Math.floor(Math.random() * cellsHorize);

const stepThroughCell = (row, col)=>{
    //IF I HAVE VISITED THE CELL AT [ROW, COL], THEN RETURN
    if(grid[row][col]){
        return;
    }
    //MARK THIS CELL AS BEEN VISITED
    grid[row][col] = true;
    //ASSEMBLE RANDOMLY ORDEREDLIST OF NEIGHBOURS
    const nigbors = shuffle([
        [row - 1, col, 'up'],
        [row, col + 1, 'right'],
        [row + 1, col, 'down'],
        [row, col - 1, 'left']
    ]);
    //FOR EACH NEIGHBOUR ...
    for(let nigbor of nigbors){    
        //CHECK IF THIS NEIGHBOUR IS OUT OF BOUNDS
        const [nextRow, nextCol, direction] = nigbor;
        if(nextRow < 0 || nextRow >= cellsVertic || nextCol < 0 || nextCol >= cellsHorize){
            continue;
        }
        //IF NEIGHBOUR IS VISIED , CONTINUE TO NEXT CELL
        if(grid[nextRow][nextCol]){
            continue;
        }
        //REMOVE A WALL FROM THAT CELL TO THE NEXT NEIGHBOUR
        if(direction === 'left'){
            verticals[row][col-1] = true;
        }else if(direction === 'right'){
            verticals[row][col] = true
        }
        if(direction === 'up'){
            horize[row - 1][col] = true;
        }else if(direction === 'down'){
            horize[row][col] = true;
        }
        stepThroughCell(nextRow, nextCol);
    }
    //VISIT THE NEXT CELL
    
 };
stepThroughCell(startRow, startCol);

//HORIZONTAL WALLS
horize.forEach((row, rowIndex)=>{
    row.forEach((open, colIndex)=>{
        if(open){ 
            return;
        }
        const wall = Bodies.rectangle(
            colIndex * unitWidth + unitWidth * .5,
            rowIndex * unitLength + unitLength,
            unitWidth, 3, {
                isStatic: true,
                label: 'wall',
                render:{
                    fillStyle: '#ffff00'
                }
            }
        );
        World.add(world, wall);
    })
})

//VERTICAL WALLS
verticals.forEach((row, rowIndex)=>{
    row.forEach((open, colIndex)=>{
        if(open){
            return;
        }
        const wall = Bodies.rectangle(
            rowIndex * unitWidth + unitWidth,
            colIndex * unitLength + unitLength * .5,
            3, unitLength, {
                isStatic: true,
                label: 'wall',
                render:{
                    fillStyle: '#ffff00'
                }
            }
        );
        World.add(world, wall)
    });
});

//END GOAL
const goal = Bodies.rectangle(
    width - (unitWidth * .5),
    height - (unitLength * .5),
    unitWidth * .5,
    unitLength * .7,
    {   isStatic: true,
        label: 'goal',
        render:{
        fillStyle: '#008ae6'
        }
    },
);
World.add(world, goal);

//BALL
const ballRadius = Math.min(unitWidth, unitLength) / 4;
const ball = Bodies.circle(
    unitWidth * .5,
    unitLength * .5,
    ballRadius,
    {   label: 'ball',
        render:{
            fillStyle: '#008ae6'
        }
    }
);
World.add(world, ball);

//KEYBRESS
document.addEventListener('keydown', event => {
    const {x , y} = ball.velocity;
    //UP
    if(event.keyCode === 38 || event.keyCode === 87){
        Body.setVelocity(ball, {x, y: y - 3})
    }
    //DOWN
    if(event.keyCode === 40 || event.keyCode === 83){
        Body.setVelocity(ball, {x, y: y + 3})
    }
    //RIGHT
    if(event.keyCode === 39 || event.keyCode === 68){
        Body.setVelocity(ball, {x: x + 3, y})
    }
    //LEFT
    if(event.keyCode === 37 || event.keyCode === 65){
        Body.setVelocity(ball, {x: x - 3, y})
    }
})

//WINNING EVENT
Events.on(engine, 'collisionStart', event =>{
    event.pairs.forEach(collision=>{
        const labels = ['ball', 'goal'];
        if(
            labels.includes(collision.bodyA.label) && 
            labels.includes(collision.bodyB.label)
            ){
                document.querySelector('.winner').classList.remove('hidden');
                world.gravity.y = 1;
                world.bodies.forEach(body=>{
                    if(body.label === 'wall'){
                        Body.setStatic(body, false);
                    }
                })
        }
    });
});

//START NEW GAME
const newGameButt = document.querySelector('#newgame');
newGameButt.addEventListener('click', event => {location.reload()})