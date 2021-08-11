/////////////////////////////////////////////////////////////////
// MODAL MERGE AUTHORITY COMPONENT
/////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////
export let modalmergecomponent = {
    template: `
                <div v-show="visible" class="modal" tabindex="-1">
                  <div class="modal-dialog">
                    <div class="modal-content">
                      <div class="modal-header">
                        <h5 class="modal-title">Merge Authorities Form</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                      </div>
                      <div class="modal-body">
                        <p>Modal body text goes here.</p>
                      </div>
                      <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                        <button type="button" class="btn btn-primary">Merge</button>
                      </div>
                    </div>
                  </div>
                </div>
              `
    ,
    data: function () {
      return {
        visible: false
      }
    }
  }