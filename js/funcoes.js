const commands = [];
const lin = 8;
const col = 8;
const largura = 60;
const altura = 60;
const houseIcon = "🕳️";
const personIcon = "💀";
const targetIcon = "🎯";
const checkedTargetIcon = "✅";
const personLocation = { x: 0, y: 0 };
const houseLocation = { x: 5, y: 5 };
const gameStatus = { won: "won", lostOutOfBounds: "lostOFB", lostObjectives: "lostOBJ", playing: "playing" };
const destinations = Array.from({ length: 12 }, () => ({ x: randomBetween(0, col - 1), y: randomBetween(0, lin - 1) }));

class Command {
    constructor(direction) {
        this.direction = direction;
        this.commandElement = document.createElement("li");
        this.commandElement.innerText = translate(direction);
        document.querySelector("#comandos").appendChild(this.commandElement);
    }

    consume() {
        this.commandElement.remove();
        
        switch (this.direction) {
            case "up":
                personLocation.y--;
                break;
            case "down":
                personLocation.y++;
                break;
            case "left":
                personLocation.x--;
                break;
            case "right":
                personLocation.x++;
                break;
        }

        return updateTable();
    }
}

function createTable() {
    let tb = document.querySelector("#tabela");
    tb.setAttribute("border",1);
    
    for (let i = 0 ; i < lin ; i++){
        let tr = document.createElement("tr");

        for(let j = 0 ; j < col ; j++){
            let td = document.createElement("td");
            td.setAttribute("width", largura);
            td.setAttribute("height", altura);
            td.id = `${j}-${i}`;
            tr.appendChild(td);
        }

        tb.appendChild(tr);
    }

    randomizeLocations();
}

function updateTable() {
    let currentStatus = gameStatus.playing;

    if (personLocation.x < 0 || personLocation.y < 0 || personLocation.x >= col || personLocation.y >= lin) {
        currentStatus = gameStatus.lostOutOfBounds;
    }

    if (personLocation.x === houseLocation.x && personLocation.y === houseLocation.y && commands.length === 0) {
        const allFound = document.querySelectorAll("[data-found]");
        if (allFound.length !== destinations.length) {
            currentStatus = gameStatus.lostObjectives;
        }
        else {
            currentStatus = gameStatus.won;
        }
    }

    for (let destination of destinations) {
        if (personLocation.x === destination.x && personLocation.y === destination.y) {
            const destinationElement = getLocation(destination.x, destination.y);
            destinationElement.dataset.found = "";
        }
    }

    let personElement = document.querySelector("[data-person]");
    let houseElement = document.querySelector("[data-house]");
    let targetElements = document.querySelectorAll("[data-target]");

    if (personElement) {
        personElement.innerText = "";
        delete personElement.dataset.person;
    }
    if (houseElement) {
        houseElement.innerText = "";
        delete houseElement.dataset.house;
    }
    if (targetElements?.length > 0) {
        for (let targetElement of targetElements) {
            targetElement.innerText = "";
            delete targetElement.dataset.target;
        }
    }

    for (let destination of destinations) {
        const destinationElement = getLocation(destination.x, destination.y);
        if (destinationElement.dataset.found === "")
            destinationElement.innerText = checkedTargetIcon;
        else
            destinationElement.innerText = targetIcon;
        destinationElement.dataset.target = "";
    }

    personElement = getLocation(personLocation.x, personLocation.y);
    if (personElement != null) {
        personElement.innerText = personIcon;
        personElement.dataset.person = "";
    }

    houseElement = getLocation(houseLocation.x, houseLocation.y);
    if (houseElement != null) {
        houseElement.innerText = houseIcon;
        houseElement.dataset.house = "";
    }


    return currentStatus;
}

let running = false;
function addCommand(direction) {
    if (running === true) return;

    commands.push(new Command(direction));
}

function pathFind(location) {
    if (running === true) return;

    const [originalPersonX, originalPersonY] = [personLocation.x, personLocation.y];
    const [originalLocationX, originalLocationY] = [location.x, location.y];

    while (true) {
        const dx = location.x - personLocation.x;
        const dy = location.y - personLocation.y;

        if (dx > 0) {
            addCommand("right");
            personLocation.x++;
        }
        else if (dx < 0) {
            addCommand("left");
            personLocation.x--;
        }
        else if (dy > 0) {
            addCommand("down");
            personLocation.y++;
        }
        else if (dy < 0) {
            addCommand("up");
            personLocation.y--;
        }
        else {
            break;
        }
    }

    personLocation.x = originalPersonX;
    personLocation.y = originalPersonY;
    location.x = originalLocationX;
    location.y = originalLocationY;
}

async function consumeCommands() {
    if (running === true) return;
    running = true;

    try {
        const length = commands.length

        for (let i = 0; i < length; i++) {
            const command = commands.shift();
            await sleep(200);
            const result = command.consume();
            if (result !== gameStatus.playing) {

                await sleep(0);

                if (result === gameStatus.won) {
                    alert("Parabéns! Você encontrou o andar de baixo!");
                }
                if (result === gameStatus.lostObjectives) {
                    alert("Você perdeu por não ter encontrado todos os objetivos!");
                }
                if (result === gameStatus.lostOutOfBounds) {
                    alert("Você perdeu por ter saído do tabuleiro!");
                }

                for (let target of document.querySelectorAll("[data-target]")) {
                    target.innerText = targetIcon;
                }
                
                for (let found of document.querySelectorAll("[data-found]")) {
                    delete found.dataset.found;
                }

                randomizeLocations();

                break;
            }
        }
    }
    finally {
        commands.length = 0;
        document.querySelector("#comandos").innerHTML = "";
        running = false;
    }
}

function getLocation(x, y) {
    return document.getElementById(`${x}-${y}`);
}

function getDistance(first, second) {
    const dx = second.x - first.x;
    const dy = second.y - first.y;
    return Math.sqrt((dx * dx) + (dy * dy));
}

function sleep(time) {
    return new Promise(resolve => setTimeout(resolve, time));
}

function randomizeLocations() {
    personLocation.x = randomBetween(0, col - 1);
    personLocation.y = randomBetween(0, lin - 1);
    houseLocation.x = randomBetween(0, col - 1);
    houseLocation.y = randomBetween(0, lin - 1);
    for (let destination of destinations) {
        destination.x = randomBetween(0, col - 1);
        destination.y = randomBetween(0, lin - 1);
    }

    while (anyCollides()) {
        personLocation.x = randomBetween(0, col - 1);
        personLocation.y = randomBetween(0, lin - 1);
        houseLocation.x = randomBetween(0, col - 1);
        houseLocation.y = randomBetween(0, lin - 1);
        for (let destination of destinations) {
            destination.x = randomBetween(0, col - 1);
            destination.y = randomBetween(0, lin - 1);
        }
    }

    updateTable();

    function anyCollides() {
        const houseAndPersonCollides = houseLocation.x === personLocation.x && houseLocation.y === personLocation.y;
        const houseAndDestinationsCollide = destinations.some(destination => destination.x === houseLocation.x && destination.y === houseLocation.y);
        const personAndDestinationsCollide = destinations.some(destination => destination.x === personLocation.x && destination.y === personLocation.y);
        const destinationsCollide = destinations.some((destination, index) => 
            destinations.some((otherDestination, otherIndex) => index !== otherIndex && destination.x === otherDestination.x && destination.y === otherDestination.y));

        return houseAndPersonCollides || houseAndDestinationsCollide || personAndDestinationsCollide || destinationsCollide;
    }
}
 
function randomBetween(min, max) {
    return Math.floor(Math.random() * (max - min + 1) + min);
}

function translate(direction) {
    switch (direction) {
        case "up":
            return "⬆️";
        case "down":
            return "⬇️";
        case "left":
            return "⬅️";
        case "right":
            return "➡️";
    }
}

document.addEventListener("DOMContentLoaded", () => {
    createTable();
});

[...document.querySelectorAll("[data-direction]")].forEach((el) => {
    el.addEventListener("mousedown", (ev) => {
        const element = ev.target.closest("[data-direction]");
        if (element) {
            addCommand(element.dataset.direction)
        }
    })
});

document.getElementById("play").addEventListener("mousedown", consumeCommands);
document.getElementById("bot").addEventListener("mousedown", (ev) => {
    const [originalPersonX, originalPersonY] = [personLocation.x, personLocation.y];
    let min = Infinity;
    let minDestination = null;
    do {
        for (let destination of destinations) {
            if (destination.checked === true) continue;

            const distance = getDistance(personLocation, destination);
            if (distance < min) {
                min = distance;
                minDestination = destination;
            }
        }

        pathFind(minDestination);
        minDestination.checked = true;
        personLocation.x = minDestination.x;
        personLocation.y = minDestination.y;
        minDestination = null;
        min = Infinity;
    } while (destinations.some(el => el.checked == null))

    destinations.forEach(el => delete el.checked);

    pathFind(houseLocation);

    personLocation.y = originalPersonY;
    personLocation.x = originalPersonX;
});
