import { Jmarc } from "../api/jmarc.mjs";
import { EventBus } from "../utils/event-bus.js";
import { recordcontrols } from "./recordcontrols.js";

export let recordcomponent = {
    props: {
        api_prefix: { type: String, required: true },
        _id: { type: [String, Number], required: true },
        collection: { type: String, required: true }
    },
    components: { recordcontrols },
    template: `
      <div class="record-component" v-if="!loading && jmarc">
        <div class="d-flex justify-content-between align-items-center mb-2 alert-info text-dark">
          <h5 class="ml-1">{{ collection }}/{{ _id }}</h5>
          <div>
            <recordcontrols
              :jmarc="jmarc"
              :readonly="false"
              @save-record="onControl('save-record', jmarc)"
              @delete-record="onControl('delete-record', jmarc)"
              @close-record="onControl('close-record', jmarc)"
            />
          </div>
        </div>
        <div v-if="error" class="alert alert-danger">{{ error }}</div>
        <table class="table table-bordered table-sm table-hover">
          
          <thead>
            <tr>
              <th style="width:3em;"></th>
              <th style="width:3em;"></th>
              <th></th>
              <th></th>
            </tr>
          </thead>
          
          <tbody>
            <tr v-if="jmarc.flags" class="alert alert-danger">
              <td colspan="4">
                <ul>
                  <li v-for="flag in jmarc.flags">{{flag.message}}</li>
                </ul>
              </td>
            </tr>
            <tr v-for="(field, idx) in jmarc.fields" :key="field.tag + '-' + idx">
              
              <!-- Tag -->
              <td>
                <template v-if="editField && editField.tag === field.tag && editField.idx === idx">
                  <input 
                    type="text" 
                    :id="field.tag + '-' + idx"
                    v-model.trim="editTag"
                    maxlength="3"
                    style="width:3.5em; text-align:center;"
                    class="form-control form-control-sm d-inline"
                    @blur="saveEditField(field)"
                    :tabindex="idx"
                  />
                </template>
                <template v-else>
                  <code v-if="!isControlField(field)" class="text-primary" 
                    @click="startEditField(field, idx)"
                    @keydown.enter.prevent="startEditField(field, idx)"
                    @keydown.space.prevent="startEditField(field, idx)">{{ field.tag }}</code>
                  <code v-else class="text-primary">{{ field.tag }}</code>
                </template>
              </td>

              <!-- Indicators -->
              <td>
                <template v-if="editField && editField.tag === field.tag && editField.idx === idx">
                  <input
                    v-model="editIndicators[0]"
                    maxlength="1"
                    style="width:2em; text-align:center;"
                    class="form-control form-control-sm d-inline"
                    @blur="saveEditField(field)"
                    :tabindex="idx+1"
                  />
                  <input
                    v-model="editIndicators[1]"
                    maxlength="1"
                    style="width:2em; text-align:center; margin-left:0.5em;"
                    class="form-control form-control-sm d-inline"
                    @blur="saveEditField(field)"
                    :tabindex="idx+2"
                  />
                </template>
                <template v-else>
                  <span v-if="field.indicators" 
                    @click="startEditField(field, idx)"
                    @keydown.enter.prevent="startEditField(field, idx)"
                    @keydown.space.prevent="startEditField(field, idx)">{{ field.indicators.join(' ') }}
                  </span>
                </template>
              </td>

              <!-- Subfields -->
              <td>
                <template v-if="!isControlField(field)">
                  <div v-if="editField && editField.tag === field.tag && editField.idx === idx">
                    <span v-for="(sf, sidx) in editSubfields" :key="sf.code + '-' + sidx" style="position:relative; display: flex; align-items: flex-start; margin-bottom: 0.25em;">
                      <span class="mx-1" style="min-width: 2.5em; text-align: right; padding-top: 0.3em;">
                        <input
                          v-model="editSubfields[sidx].code"
                          maxlength="1"
                          style="width:2em; text-align:center;"
                          class="form-control form-control-sm d-inline"
                        />
                      </span>
                      <textarea
                        :ref="'editInput-' + field.tag + '-' + idx + '-' + sidx"
                        v-model="editSubfields[sidx].value"
                        style="width:100%;min-width:120px;max-width:400px;min-height:2em;resize:vertical; margin-left: 0.5em;"
                        @keydown="handleSubfieldKeydown($event, field, idx, sidx)"
                        :tabindex="sidx + 1"
                        @focus="$event.target.select(); autoResizeTextarea('editInput-' + field.tag + '-' + idx + '-' + sidx)"
                        @input="autoResizeTextarea('editInput-' + field.tag + '-' + idx + '-' + sidx); handleSubfieldInput($event, field, idx, sidx)"
                        
                        rows="1"
                        :title="'Press Enter to save, Shift+Enter for newline, Tab to move, Esc to cancel'"
                      ></textarea>
                        <a
                          v-if="isAuthorityControlled(field, sf.code) && (field.subfields[sidx] && field.subfields[sidx].xref)"
                          :href="'/editor?records=auths/' + field.subfields[sidx].xref"
                          target="_blank"
                          @click.stop
                          title="Open authority record in new window"
                          style="margin-left:0.3em; color: #007bff; text-decoration: none;"
                        >
                          <i class="fas fa-link mr-2"></i>
                        </a>
                      <!-- Authority lookup dropdown -->
                      <div v-if="lookupDropdown && lookupDropdown.fieldIdx === idx && lookupDropdown.subfieldIdx === sidx"
                           class="typeahead-dropdown"
                           style="position:absolute;z-index:10;background:white;border:1px solid #ccc;max-height:200px;overflow-y:auto;width:100%;left:0;top:2.2em;">
                        <div v-if="lookupDropdown.loading" class="p-2 text-muted">Searching...</div>
                        <div v-else-if="lookupDropdown.choices.length === 0" class="p-2 text-muted">No matches</div>
                        <div v-else>
                          <div v-for="(choice, cidx) in lookupDropdown.choices"
                               :key="cidx"
                               class="typeahead-choice p-2"
                               :class="{'bg-primary text-white': lookupDropdown.highlighted === cidx}"
                               style="cursor:pointer;"
                               @mousedown.prevent="selectLookupChoice(choice, sidx)">
                            <span v-for="sub in choice.subfields" :key="sub.code + '-' + sub.value">
                              <code>\${{ sub.code }}</code> {{ sub.value }}&nbsp;
                            </span>
                          </div>
                        </div>
                      </div>
                    </span>
                  </div>
                  <div v-else>
                    <span
                      v-for="(subfield, sidx) in field.subfields"
                      :key="subfield.code + '-' + subfield.value"
                      tabindex="0"
                      class="editable-subfield"
                      @click="startEditField(field, idx, sidx)"
                      @keydown.enter.prevent="startEditField(field, idx, sidx)"
                      @keydown.space.prevent="startEditField(field, idx, sidx)"
                      @blur="saveEditField(field)"
                      title="Click or press Enter/Space to edit"
                      style="cursor:pointer;"
                    >
                      <code>\${{ subfield.code }}</code> {{ subfield.value }}&nbsp;
                      <a
                        v-if="isAuthorityControlled(field, subfield.code) && subfield.xref"
                        :href="'/editor?records=auths/' + subfield.xref"
                        target="_blank"
                        @click.stop
                        title="Open authority record in new window"
                        style="margin-left:0.3em; color: #007bff; text-decoration: none;"
                      >
                        <i class="fas fa-link mr-2"></i>
                      </a>
                    </span>
                  </div>
                </template>
                <!-- Not editable for controlfields -->
                <template v-else>
                  <span v-for="subfield in field.subfields" :key="subfield.code + '-' + subfield.value">
                    <code>\${{ subfield.code }}</code> {{ subfield.value }}&nbsp;
                  </span>
                </template>
              </td>

            </tr>
          </tbody>
        </table>
      </div>
      <div v-else-if="loading" class="text-muted">Loading...</div>
      <div v-else-if="error" class="alert alert-danger">{{ error }}</div>
    `,
    data() {
        return {
            jmarc: null,
            loading: true,
            error: null,
            selectedFields: [],
            editField: null, // { tag, idx }
            editSubfields: [], // For editing subfields
            editSubfieldIndex: 0, // Track which subfield is being edited
            editTag: null,
            editIndicators: [],
            lookupDropdown: null, // { fieldIdx, subfieldIdx, choices: [], loading: bool }
        };
    },
    async created() {
        Jmarc.apiUrl = this.api_prefix;
        try {
            this.jmarc = await Jmarc.get(this.collection, this._id);
            this.validateRecord();
            this.loading = false;
        } catch (e) {
            this.error = e.message || "Failed to load record";
            this.loading = false;
        }
    },
    methods: {
        isControlField(field) {
            return field.constructor.name === 'ControlField';
        },
        isAuthorityControlled(field, code) {
            return this.jmarc && this.jmarc.isAuthorityControlled(field.tag, code);
        },
        autoResizeTextarea(refName) {
            this.$nextTick(() => {
                let textarea = this.$refs[refName];
                if (Array.isArray(textarea)) textarea = textarea[0];
                if (textarea && textarea.style) {
                    textarea.style.height = 'auto';
                    textarea.style.height = textarea.scrollHeight + 'px';
                }
            });
        },
        startEditField(field, fieldIdx, subfieldIdx = 0) {
            this.editField = { tag: field.tag, idx: fieldIdx };
            this.editSubfields = field.subfields;
            this.editSubfieldIndex = subfieldIdx;
            this.editTag = field.tag;
            this.editIndicators = field.indicators ? [...field.indicators] : ["", ""];
            this.lookupDropdown = null;
            this.$nextTick(() => {
                const refName = `editInput-${field.tag}-${fieldIdx}-${subfieldIdx}`;
                this.autoResizeTextarea(refName);
                let input = this.$refs[refName];
                if (Array.isArray(input)) input = input[0];
                if (input && input.focus) input.focus();
            });
        },
        saveEditField(field) {
            // Save tag and indicators
            field.tag = this.editTag;
            field.indicators = this.editIndicators.map(i => i || " ");
            // Save subfields
            field.subfields = this.editSubfields;
            this.editField = null;
            this.lookupDropdown = null;
            this.validateRecord()
        },
        cancelEditField() {
            // Revert all edited subfields to their original values if authority controlled
            if (this.lookupDropdown) {
                const { fieldIdx } = this.lookupDropdown;
                this.editSubfields.forEach((sf, sidx) => {
                    if (
                        this.isAuthorityControlled(this.jmarc.fields[fieldIdx], sf.code) &&
                        sf.originalValue !== undefined
                    ) {
                        sf.value = sf.originalValue;
                        this.jmarc.fields[fieldIdx].subfields[sidx].value = sf.originalValue;
                    }
                });
            }
            this.editField = null;
            this.lookupDropdown = null;
        },
        async handleSubfieldInput(e, field, fieldIdx, sidx) {
            // Store the original value if not already stored
            if (!this.editSubfields[sidx].originalValue) {
                this.editSubfields[sidx].originalValue = field.subfields[sidx].value;
            }

            // Update the subfield value in the actual field before lookup
            field.subfields[sidx].value = this.editSubfields[sidx].value;

            if (!this.isAuthorityControlled(field, this.editSubfields[sidx].code)) return;
            const value = this.editSubfields[sidx].value;
            if (!value || value.length < 2) {
                this.lookupDropdown = null;
                return;
            }
            this.lookupDropdown = {
                fieldIdx,
                subfieldIdx: sidx,
                choices: [],
                loading: true,
                selected: null,
                highlighted: 0
            };
            try {
                const choices = await field.lookup();
                this.lookupDropdown.choices = choices;
                this.lookupDropdown.loading = false;
            } catch (err) {
                this.lookupDropdown.choices = [];
                this.lookupDropdown.loading = false;
            }
        },
        selectLookupChoice(choice, sidx) {
            // --- BEGIN MULTI-SUBFIELD AUTHORITY LOGIC ---
            // Find the field and jmarc
            const fieldIdx = this.lookupDropdown.fieldIdx;
            const field = this.jmarc.fields[fieldIdx];
            const jmarc = this.jmarc;

            // Get the set of authority-controlled subfield codes for this field
            const authControlledCodes = Object.keys(jmarc.authMap && jmarc.authMap[field.tag] ? jmarc.authMap[field.tag] : {});

            // Track which codes are in the authority choice
            const inChoiceCodes = choice.subfields.map(x => x.code);

            // 1. For each subfield in the authority choice, set value/xref on the corresponding subfield in the field
            for (let choiceSubfield of choice.subfields) {
                // Only process authority-controlled codes
                if (!authControlledCodes.includes(choiceSubfield.code)) continue;

                // Find or create the subfield in the field
                let currentSubfield = field.subfields.find(sf => sf.code === choiceSubfield.code);
                if (!currentSubfield) {
                    // Create new subfield at the correct position
                    let place = choice.subfields.indexOf(choiceSubfield);
                    // If using a Jmarc API, ensure this creates and inserts at the right place
                    currentSubfield = field.createSubfield(choiceSubfield.code, place);
                    // If using Vue, also update editSubfields
                    if (this.editSubfields && this.editSubfields.length < field.subfields.length) {
                        this.editSubfields.splice(place, 0, { code: choiceSubfield.code, value: choiceSubfield.value, xref: choiceSubfield.xref });
                    }
                }
                // Set value and xref
                currentSubfield.value = choiceSubfield.value;
                currentSubfield.xref = choiceSubfield.xref;
                // Also update editSubfields if editing
                if (this.editSubfields) {
                    let editIdx = field.subfields.indexOf(currentSubfield);
                    if (editIdx !== -1) {
                        this.editSubfields[editIdx].value = choiceSubfield.value;
                        this.editSubfields[editIdx].xref = choiceSubfield.xref;
                    }
                }
            }

            // 2. Remove any authority-controlled subfields in the field that are not in the authority choice
            for (let i = field.subfields.length - 1; i >= 0; i--) {
                let sf = field.subfields[i];
                if (authControlledCodes.includes(sf.code) && !inChoiceCodes.includes(sf.code)) {
                    field.subfields.splice(i, 1);
                    if (this.editSubfields) this.editSubfields.splice(i, 1);
                }
            }

            // 3. Mark the lookupDropdown as selected (for revert logic)
            this.lookupDropdown.selected = {
                value: choice.subfields.map(sf => sf.value).join(" "),
                xref: choice.subfields[0].xref
            };

            // 4. Save immediately after selection
            this.saveEditField(field);
        },
        handleSubfieldKeydown(e, field, fieldIdx, sidx) {
            const isAuth = this.isAuthorityControlled(field, this.editSubfields[sidx].code);
            const lookupActive = this.lookupDropdown &&
                this.lookupDropdown.fieldIdx === fieldIdx &&
                this.lookupDropdown.subfieldIdx === sidx &&
                this.lookupDropdown.choices.length > 0;

            if (e.key === "Tab" && isAuth && lookupActive && !this.lookupDropdown.selected) {
                // Prevent tabbing out if no valid authority value is selected
                e.preventDefault();
                // Optionally, show a message or highlight the field
                // this.showAuthorityRequired = true;
                return;
            }

            // Arrow key navigation for lookup choices
            if (
                this.lookupDropdown &&
                this.lookupDropdown.fieldIdx === fieldIdx &&
                this.lookupDropdown.subfieldIdx === sidx &&
                this.lookupDropdown.choices.length > 0
            ) {
                if (e.key === "ArrowDown") {
                    e.preventDefault();
                    let next = this.lookupDropdown.highlighted + 1;
                    if (next >= this.lookupDropdown.choices.length) next = 0;
                    this.lookupDropdown.highlighted = next;
                    return;
                }
                if (e.key === "ArrowUp") {
                    e.preventDefault();
                    let prev = this.lookupDropdown.highlighted - 1;
                    if (prev < 0) prev = this.lookupDropdown.choices.length - 1;
                    this.lookupDropdown.highlighted = prev;
                    return;
                }
                if (e.key === "Enter" && this.lookupDropdown.choices.length > 0) {
                    // Select highlighted choice and save
                    e.preventDefault();
                    const choice = this.lookupDropdown.choices[this.lookupDropdown.highlighted];
                    this.selectLookupChoice(choice, sidx);
                    return;
                }
            }

            if (e.key === "Enter" && !e.shiftKey) {
                this.saveEditField(this.jmarc.fields[fieldIdx]);
            } else if (e.key === "Escape") {
                this.cancelEditField();
            } else if (e.key === "Tab") {
                e.preventDefault();
                // Tab navigation across all editable subfields in the record
                const editableFields = this.jmarc.fields
                    .map((f, idx) => ({ field: f, idx }))
                    .filter(f => !this.isControlField(f.field));
                let flatList = [];
                editableFields.forEach(({ field, idx }) => {
                    field.subfields.forEach((sf, sfi) => {
                        flatList.push({ field, fieldIdx: idx, subfieldIdx: sfi });
                    });
                });
                const currentFlatIdx = flatList.findIndex(
                    x => x.fieldIdx === fieldIdx && x.subfieldIdx === sidx
                );
                let nextFlatIdx = currentFlatIdx + (e.shiftKey ? -1 : 1);
                if (nextFlatIdx >= 0 && nextFlatIdx < flatList.length) {
                    const next = flatList[nextFlatIdx];
                    this.startEditField(next.field, next.fieldIdx, next.subfieldIdx);
                } else {
                    // If tabbing past last subfield, save
                    if (!e.shiftKey) this.saveEditField(this.jmarc.fields[fieldIdx]);
                }
            }
        },
        handleSubfieldBlur(field, fieldIdx, sidx) {
            // If authority controlled and no lookup choice selected, revert value
            if (
                this.lookupDropdown &&
                this.lookupDropdown.fieldIdx === fieldIdx &&
                this.lookupDropdown.subfieldIdx === sidx &&
                this.isAuthorityControlled(field, this.editSubfields[sidx].code) &&
                (!this.lookupDropdown.selected)
            ) {
                if (this.editSubfields[sidx].originalValue !== undefined) {
                    this.editSubfields[sidx].value = this.editSubfields[sidx].originalValue;
                    field.subfields[sidx].value = this.editSubfields[sidx].originalValue;
                }
            }
        },
        validateRecord() {
          // Perform comprehensive validation
          // We can still do indicator and subfield level validations
          this.jmarc.flags = this.jmarc.allValidationWarnings();
          if (this.jmarc.flags.length > 0) {
            return false;
          }
          return true;
        },
        async saveRecord() {
          if (!this.validateRecord()) return;
          if (this.jmarc.saved) return;
          try {
              await this.jmarc.put();
              this.$emit('saved', this.jmarc);
          } catch (e) {
              this.error = e.message || "Failed to save record";
          }
        },
        async deleteRecord() {
            if (!confirm("Are you sure you want to delete this record?")) return;
            try {
                await this.jmarc.delete();
                EventBus.$emit('remove-record', { collection: this.collection, record_id: this._id });
            } catch (e) {
                this.error = e.message || "Failed to delete record";
            }
        },
        
        onControl(action, jmarc) {
            if (action === 'save-record') this.saveRecord();
            if (action === 'delete-record') this.deleteRecord();
            if (action === 'close-record') {
              if (!this.jmarc.saved) {
                if(!confirm("You have unsaved changes. Are you sure you want to close the record?")) return;
              }
              EventBus.$emit('remove-record', { collection: this.collection, record_id: this._id });
            }
        }
    }
};