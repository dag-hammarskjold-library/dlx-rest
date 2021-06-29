customElements.define('result-count', 
    class extends HTMLElement {
        constructor() {
            super();
            this.attachShadow({mode: 'open'});
            this.start = parseInt(`${this.getAttribute('data-start')}`);
            this.limit = parseInt(`${this.getAttribute('data-limit')}`);
            this.end = this.start + this.limit - 1;
            this.url = `${this.getAttribute('data-url')}`;
        }

        connectedCallback() {
            this.loadData();
        }

        async loadData() {
            try {
                return new Promise((res, rej) => {
                    fetch(this.url)
                        .then(data => data.json())
                        .then((json) => {
                            this.buildElement(json);
                            res();
                        });
                });
            } catch (error) {
                return rej(error);
            }
        }

        buildElement(json) {
            var mySpan = document.createElement('span');
            var resultsCount = json['data'];


            
            if(resultsCount < this.end) {
                mySpan.innerText = this.start + " to " + resultsCount + " of " + resultsCount + " records.";
            } else {
                mySpan.innerText = this.start + " to " + this.end + " of " + resultsCount + " records.";
            }

            this.shadowRoot.appendChild(mySpan.cloneNode(true));
            const myLi = document.getElementById('count');
            myLi.setAttribute("class", "page-item disabled visible");
        }
    });