export let nameworkform = {
    template: `
    <div class="modal fade" id="nameWorkform" tabindex="-1" role="dialog" aria-labelledby="nameWorkformModalTitle" aria-hidden="true">
        <div class="modal-dialog" role="document">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title" id="nameWorkformModalTitle">Describe Workform</h5>
                    <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                    <span aria-hidden="true">&times;</span>
                    </button>
                </div>
                <div class="modal-body">
                    <form>
                        <div class="form-group">
                            <label for="wfName">Workform Name</label>
                            <input v-model="name" type="text" class="form-control" id="wfName" aria-describedby="wfHelp" placeholder="Enter workform name">
                            <small id="wfHelp" class="form-text text-muted">Letters and numbers only.</small>
                        </div>
                        <div class="form-group">
                            <label for="wfDescription">Workform Description</label>
                            <input v-model="description" type="text" class="form-control" id="wfDescription" placeholder="Enter workform description">
                        </div>
                        <button type="submit" class="btn btn-primary" data-dismiss="modal" @click="submitName(name, description)">Submit</button>
                    </form>
                </div>
                <div class="modal-footer">
                    <button type="submit" class="btn btn-secondary" data-dismiss="modal">Cancel</button>
                </div>
            </div>
        </div>
    </div>
    `,
    data: function() {
        return {
            name: null,
            description: null
        }
    },
    methods: {
        submitName(name, description) {
            this.$emit('submit-name', name, description)
        }
    }
} 