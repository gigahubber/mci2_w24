
export function keyboard() {
    // aktive Tasten, auf die reagiert wird
    const keys = {};

    // vom Listener aufgerufen
    // wenn Taste "aktiviert", dann rufe Callback auf
    function toggle(event, active) {
        if (keys[event.key]) {
            const ko = keys[event.key];
            if (ko.active !== active) {
                ko.active = active;
                ko.callback(active);
            }
        } else {
            if (["Control", "Meta", "Shift"].includes(event.key) === false)
                console.log("key", event.key);
        }
    }

    // Listener
    document.addEventListener("keydown", (ev) => toggle(ev, true));
    document.addEventListener("keyup", (ev) => toggle(ev, false));

    // Funktion, die Tasten "aktiviert"
    return function (key, callback) {
        keys[key] = {
            active: false,
            callback
        }
    }
}

export function mouse(cursor) {
    const MOVESCALE = 0.001;
    const mouseButtons = [false, false, false, false];
    function toggle(ev, active) { mouseButtons[ev.which] = active; }


    function onMouseMove(event) {
        const dx = event.movementX * MOVESCALE;
        const dy = event.movementY * MOVESCALE;
        const isRotation = event.ctrlKey;
        if (!isRotation && mouseButtons[1]) {
            cursor.position.x += dx;
            cursor.position.z += dy;
        }
        if (!isRotation && mouseButtons[3]) {
            cursor.position.x += dx;
            cursor.position.y += -dy;
        }

        if (isRotation && mouseButtons[1]) {
            cursor.rotation.x += dy;
            cursor.rotation.z += dx;
        }

        cursor.updateMatrix();
    }

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mousedown', ev => toggle(ev, true));
    document.addEventListener('mouseup', ev => toggle(ev, false));
    document.addEventListener('contextmenu', ev => {
        ev.preventDefault();
        ev.stopPropagation();
        return false;
    });

    return function (idx) {
        return mouseButtons[idx];
    }
}
