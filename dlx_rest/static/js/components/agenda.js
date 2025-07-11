export let agendamodal = {
    props: ["agendas"],
    template: `
    <div id="preview-text" class="modal-body">
      <ul>
          <li v-for="agenda in agendas">{{agenda}}</li>
      </ul>
    </div>
    `
}