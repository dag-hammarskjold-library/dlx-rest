export let agendamodal = {
    template: `<div v-if="showModal">
    <transition name="modal">
      <div class="modal-mask">
        <div class="modal-wrapper">
          <div class="modal-dialog modal-xl" role="document">
            <div class="modal-content">
              <div class="modal-header">
                <h5 class="modal-title">Speeches / {{recordId}}: Agendas</h5>
                <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                  <span aria-hidden="true" @click="showModal = false">&times;</span>
                </button>
              </div>
              <div id="preview-text" class="modal-body">
                <ul>
                    <li v-for="agenda in agendas">{{agenda}}</li>
                </ul>
              </div>
              <div class="modal-footer">
                <button type="button" class="btn btn-secondary" @click="showModal = false">Close</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </transition>
  </div>`,
    data: function() {
        return {
            recordId: "",
            agendas: [],
            showModal: false
        }
    }
}