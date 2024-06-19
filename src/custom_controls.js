import Control from 'ol/control/Control';
export class SymbolControl extends Control {
    constructor(changeIconCallback) {

        const button = document.createElement('button');
        button.innerHTML = 'Symbols';
        button.classList = ['btn', 'btn-secondary', 'dropdown-toggle'];
        button.setAttribute('data-bs-toggle', "dropdown");
        button.style.minWidth = 'fit-content';
        const element = document.createElement('div');
        element.className = 'symbol-control ol-unselectable ol-control';
        let menu = document.createElement('ul');
        menu.className = "dropdown-menu";
        menu.style.width = 'fit-content';
        menu.style.minWidth = 'fit-content';
        let icons = ['marker', 'house', 'building', 'hotel'];
        for (let icon of icons) {
            let item = document.createElement('li');
            item.onclick = function () { changeIconCallback(icon) };
            let img = document.createElement('img');
            img.setAttribute('src', `img/${icon}.png`);
            item.appendChild(img);
            menu.appendChild(item);
        }
        element.appendChild(button);
        element.appendChild(menu);
        super({
            element: element,
            target: undefined,
        });

    }
}

export class AudioRecordControl extends Control {
    constructor(mediaRecorder) {
        //const options = opt_options || {};
        let span = document.createElement('span');
        span.className = "fa-stack fa-1x";
        let circle = document.createElement('i');
        circle.className = "fas fa-circle fa-stack-2x";
        circle.style.color = "white";
        let mic = document.createElement('i');
        mic.style.color = "#666666";
        mic.className = "fas fa-microphone fa-stack-1x";
        span.appendChild(circle);
        span.appendChild(mic);
        const element = document.createElement('div');
        element.className = 'audio-control ol-unselectable ol-control';
        element.style.opacity = 'transparent';
        element.appendChild(span);
        element.style.minWidth = 'fit-content';
        super({
            element: element,
            target: undefined,
        });
        this.mic = mic;
        this.circle = circle;
        this.isRecording = false;
        this.mediaRecorder = mediaRecorder;
        span.addEventListener('click', this.handleRecord.bind(this), false);
    }

    handleRecord() {
        if (!this.isRecording) {
            this.mic.className = 'fas fa-pause fa-stack-1x';
            this.mic.style.color = 'white';
            this.circle.style.color = "Tomato";
            this.isRecording = true;
            try {
                this.mediaRecorder.start();
            } catch {

            }
            console.log("RECORDING STARTED");
        } else {
            this.mic.className = 'fas fa-microphone fa-stack-1x';
            this.mic.style.color = "#666666";
            this.circle.style.color = "white";
            this.isRecording = false;
            try {
                this.mediaRecorder.stop();
            } catch {

            }
            console.log("RECORDING STOPPED");
        }
    }
}