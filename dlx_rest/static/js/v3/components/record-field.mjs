import { RecordFieldSubfield } from "./record-field-subfield.mjs"
import { validationData } from "../../utils/validation.js"

let nextSubfieldRenderKeyId = 1
import { Jmarc } from "../../api/jmarc.mjs"

export const RecordField = {
    props: {
        field: Object,
        readonly: { type: Boolean, required: false, default: false },
      collection: { type: String, required: true },
      showValidationState: { type: Boolean, required: false, default: true }
    },
    components: { RecordFieldSubfield },
    data() {
        return {
            showMenu: false,
            showIndicator1Menu: false,
            showIndicator2Menu: false,
        advanceToNewSubfieldOnTagBlur: false,
            hasOpenDropdown: false,
          showAuthorityTooltip: false,
          authorityTooltipLoading: false,
          authorityTooltipError: '',
          authorityTooltipContent: null,
          authorityTooltipCache: {},
            authorityTooltipPosition: { top: 0, left: 0 },
            authorityTooltipHideTimeout: null,
            classes: {
                container: {
                    "record-field-container": true,
                    "field-row-selected": false
                },
                tag: { "record-field-tag": true }
            }
        }
    },
    computed: {
      fieldReadonly() {
        return this.readonly || this.field.tag === '998'
      },
        indicator1Options() {
            return this.getIndicatorValues(0)
        },
        indicator2Options() {
            return this.getIndicatorValues(1)
        },
      isFieldTagInvalid() {
        if (!this.showValidationState) return false
        return !this.getFieldValidation()
      },
        hasEditableIndicator1() {
            return this.indicator1Options.length > 0
        },
        hasEditableIndicator2() {
            return this.indicator2Options.length > 0
        },
        linkedAuthorityRecordId() {
          if (!this.field || !Array.isArray(this.field.subfields)) return null

          for (const subfield of this.field.subfields) {
            if (!subfield || !subfield.xref) continue
            if (subfield.xref instanceof Error) continue
            if (this.field.parentRecord && typeof this.field.parentRecord.isAuthorityControlled === 'function') {
              if (this.field.parentRecord.isAuthorityControlled(this.field.tag, subfield.code)) {
                return String(subfield.xref)
              }
            }
          }

          return null
        },
        hasLinkedAuthority() {
          return !!this.linkedAuthorityRecordId
        }
    },
    mounted() {
        document.addEventListener('click', this.handleClickOutside)
        // Initialize tagEl with current value
        if (this.$refs.tagEl) {
            this.$refs.tagEl.textContent = this.field.tag
        }
    },
    beforeUnmount() {
        document.removeEventListener('click', this.handleClickOutside)
      if (this.authorityTooltipHideTimeout) {
        window.clearTimeout(this.authorityTooltipHideTimeout)
        this.authorityTooltipHideTimeout = null
      }
    },
    watch: {
        'field.tag'(newTag) {
            // Update display if tag changes from outside
            if (this.$refs.tagEl && !this.$refs.tagEl.contains(document.activeElement)) {
                this.$refs.tagEl.textContent = newTag
            }
        },
        showMenu(newVal) {
            this.hasOpenDropdown = newVal
        },
        showIndicator1Menu(newVal) {
            this.hasOpenDropdown = this.showMenu || newVal || this.showIndicator2Menu
        },
        showIndicator2Menu(newVal) {
            this.hasOpenDropdown = this.showMenu || this.showIndicator1Menu || newVal
        }
    },
    methods: {
        getValidationCollection() {
            if (this.field && this.field.parentRecord && typeof this.field.parentRecord.getVirtualCollection === 'function') {
                return this.field.parentRecord.getVirtualCollection()
            }

            return this.collection
        },
        getValidationDocument() {
            const collectionMap = {
                'bibs': 'bibs',
                'speeches': 'speeches',
                'votes': 'votes',
                'auths': 'auths'
            }
            const validationCollection = this.getValidationCollection()
            return validationData[collectionMap[validationCollection] || 'bibs']
        },
        getFieldValidation(tag = this.field.tag) {
          const collectionData = this.getValidationDocument()
          if (!collectionData) return null
          return collectionData[tag] || null
        },
        // Default subfields are reused by both tag-finalization and manual subfield insertion.
        getDefaultSubfieldsForTag(tag = this.field.tag) {
          const fieldValidation = this.getFieldValidation(tag)
          const defaultSubfields = fieldValidation && Array.isArray(fieldValidation.defaultSubfields)
            ? fieldValidation.defaultSubfields
            : []

          return defaultSubfields
        },
        handleClickOutside(event) {
            if (!this.$el || !this.$el.querySelector) return

            const fieldMenuContainer = this.$el.querySelector('.field-menu-container')
            const indicator1Container = this.$el.querySelector('.indicator-1-container')
            const indicator2Container = this.$el.querySelector('.indicator-2-container')

            if (fieldMenuContainer && !fieldMenuContainer.contains(event.target)) {
                this.showMenu = false
            }
            if (indicator1Container && !indicator1Container.contains(event.target)) {
                this.showIndicator1Menu = false
            }
            if (indicator2Container && !indicator2Container.contains(event.target)) {
                this.showIndicator2Menu = false
            }
        },
        getIndicatorValues(indicatorIndex) {
          const fieldValidation = this.getFieldValidation()
          if (!fieldValidation) return []
            const indicatorKey = indicatorIndex === 0 ? 'validIndicators1' : 'validIndicators2'
            const options = fieldValidation[indicatorKey] || []

            // Filter out wildcard indicators and return
            return options.filter(opt => opt !== '*')
        },
        keyDown(event) {
            switch (event.key) {
                case 'Enter':
                    event.preventDefault()
                    event.target.blur()
                    return
            case 'Tab':
              this.advanceToNewSubfieldOnTagBlur = true
              return
                case "ArrowUp":
                case "ArrowDown":
                    return
            }
        },
        setTag(event) {
          if (this.fieldReadonly) return
            const newTag = event.target.innerText.trim()
            if (newTag.length > 0) {
                this.field.tag = newTag
                this.$emit('field-changed')
            }
        },
        finalizeTag(event) {
          if (this.fieldReadonly) return
            // Ensure tag is exactly 3 characters
            const tag = event.target.innerText.trim()
            if (tag.length > 3) {
                event.target.innerText = tag.substring(0, 3)
                this.field.tag = tag.substring(0, 3)
            } else if (tag.length < 3) {
                event.target.innerText = tag.padEnd(3, '_')
                this.field.tag = tag.padEnd(3, '_')
            } else {
                this.field.tag = tag
            }

            this.applyDefaultIndicatorsForTag()
            const firstCreatedSubfieldIndex = this.ensureDefaultSubfieldsForTag()

            if (this.advanceToNewSubfieldOnTagBlur && firstCreatedSubfieldIndex !== null) {
                this.$nextTick(() => {
                    const rows = this.$el?.querySelectorAll('.subfield-container .subfield-row') || []
                    const targetRow = rows[firstCreatedSubfieldIndex]
                    const focusable = targetRow?.querySelector('[contenteditable="true"], [tabindex="0"]')
                    if (focusable && typeof focusable.focus === 'function') {
                        focusable.focus()
                    }
                })
            }

            this.advanceToNewSubfieldOnTagBlur = false
            this.$emit('field-changed')
        },
        applyDefaultIndicatorsForTag() {
          const fieldValidation = this.getFieldValidation()

          if (!fieldValidation) {
            this.field.indicators = ['_', '_']
            return
          }

          const indicatorKeys = ['validIndicators1', 'validIndicators2']
          const normalizedIndicators = indicatorKeys.map(key => {
            const options = Array.isArray(fieldValidation[key]) ? fieldValidation[key] : []
            const validChoices = options.filter(opt => opt !== '*')
            return validChoices.length > 0 ? validChoices[0] : '_'
          })

          this.field.indicators = normalizedIndicators
        },
        ensureDefaultSubfieldsForTag() {
          if (!this.field || typeof this.field.createSubfield !== 'function') return null

          const defaultSubfields = this.getDefaultSubfieldsForTag()
          if (defaultSubfields.length === 0) return null

          const existingCodes = new Set((this.field.subfields || []).map(subfield => subfield.code))
          let firstCreatedIndex = null

          defaultSubfields.forEach(code => {
            if (!existingCodes.has(code)) {
              const createdSubfield = this.field.createSubfield(code)
              if (firstCreatedIndex === null && createdSubfield) {
                firstCreatedIndex = this.field.subfields.indexOf(createdSubfield)
              }
              existingCodes.add(code)
            }
          })

          return firstCreatedIndex
        },
        setIndicator(index, value) {
          if (this.fieldReadonly) return
            this.field.indicators[index] = value
            if (index === 0) {
                this.showIndicator1Menu = false
            } else {
                this.showIndicator2Menu = false
            }
            this.$emit('field-changed')
        },
        toggleIndicator1Menu() {
          if (this.fieldReadonly) return
            this.showIndicator1Menu = !this.showIndicator1Menu
            this.showIndicator2Menu = false
        },
        toggleIndicator2Menu() {
          if (this.fieldReadonly) return
            this.showIndicator2Menu = !this.showIndicator2Menu
            this.showIndicator1Menu = false
        },
        fieldSelected() {
            this.classes.container["field-row-selected"] = true
            this.field.selected = true
            this.$emit('field-selected', this.field)
        },
        addField() {
          if (this.fieldReadonly) return
            this.showMenu = false
            this.$emit('add-field', this.field)
        },
        deleteField() {
          if (this.fieldReadonly) return
            this.showMenu = false
            this.$emit('delete-field', this.field)
        },
        deleteSelectedFields() {
          if (this.fieldReadonly) return
            this.showMenu = false
            this.$emit('delete-selected-fields', this.field)
        },
        onSubfieldDropdownStateChanged(isOpen) {
            if (isOpen) {
                this.hasOpenDropdown = true
            } else {
                // Check if any other dropdowns are still open
                this.hasOpenDropdown = this.showMenu || this.showIndicator1Menu || this.showIndicator2Menu
            }
        },
        toggleMenu() {
            this.showMenu = !this.showMenu
        },
        openLinkedAuthority() {
          if (!this.linkedAuthorityRecordId) return
          this.$emit('open-linked-authority', {
            xref: this.linkedAuthorityRecordId,
            field: this.field
          })
        },
        getAuthorityHeading(record) {
          if (!record || typeof record.getField !== 'function') return ''

          const headingField = record.getField('100')
            || record.getField('110')
            || record.getField('111')
            || record.getField('130')
            || record.getField('150')
            || record.getField('190')
            || record.getField('191')

          if (!headingField || !Array.isArray(headingField.subfields)) return ''

          return headingField.subfields
            .map(subfield => String(subfield.value || '').trim())
            .filter(Boolean)
            .join(' ')
        },
        buildAuthorityMrkPreview(record) {
          if (!record || !Array.isArray(record.fields)) return ''

          const lines = []
          for (const field of record.fields) {
            if (!field || !field.tag) continue

            const tag = String(field.tag).padStart(3, '0')

            if (!Array.isArray(field.subfields)) {
              lines.push(`=${tag}  ${String(field.value || '')}`)
              continue
            }

            const indicators = Array.isArray(field.indicators)
              ? field.indicators.map(ind => (ind === '_' ? '\\' : ind)).join('')
              : '\\\\'

            const subfieldText = field.subfields
              .map(subfield => {
                if (!subfield || !subfield.code) return ''
                return ` $${subfield.code}${String(subfield.value || '')}`
              })
              .join('')

            lines.push(`=${tag}  ${indicators}${subfieldText}`)
          }

          return lines.join('\n')
        },
        getAuthorityScopeNote(record) {
          if (!record || typeof record.getField !== 'function') return ''

          const noteField = record.getField('678') || record.getField('680')
          if (!noteField || typeof noteField.getSubfield !== 'function') return ''

          const a = noteField.getSubfield('a')
          return a && a.value ? String(a.value) : ''
        },
        async loadLinkedAuthorityPreview() {
          const xref = this.linkedAuthorityRecordId
          if (!xref) return

          if (this.authorityTooltipCache[xref]) {
            this.authorityTooltipContent = this.authorityTooltipCache[xref]
            this.authorityTooltipError = ''
            this.authorityTooltipLoading = false
            return
          }

          this.authorityTooltipLoading = true
          this.authorityTooltipError = ''

          try {
            const authRecord = await Jmarc.get('auths', xref)
            const preview = {
              id: String(authRecord.recordId || xref),
              heading: this.getAuthorityHeading(authRecord),
              note: this.getAuthorityScopeNote(authRecord),
              mrk: this.buildAuthorityMrkPreview(authRecord)
            }
            this.authorityTooltipCache = {
              ...this.authorityTooltipCache,
              [xref]: preview
            }
            this.authorityTooltipContent = preview
          } catch (error) {
            this.authorityTooltipError = error && error.message ? error.message : String(error)
            this.authorityTooltipContent = null
          } finally {
            this.authorityTooltipLoading = false
          }
        },
        setAuthorityTooltipPosition(anchorElement) {
          if (!anchorElement || typeof anchorElement.getBoundingClientRect !== 'function') return

          const rect = anchorElement.getBoundingClientRect()
          const tooltipWidth = 320
          const margin = 8
          const viewportWidth = window.innerWidth || document.documentElement.clientWidth || 0

          let left = rect.right + margin
          if (left + tooltipWidth > viewportWidth - margin) {
            left = rect.left - tooltipWidth - margin
          }
          if (left < margin) {
            left = margin
          }

          const top = Math.max(margin, rect.top - 4)
          this.authorityTooltipPosition = { top, left }
        },
        clearAuthorityTooltipHideTimeout() {
          if (this.authorityTooltipHideTimeout) {
            window.clearTimeout(this.authorityTooltipHideTimeout)
            this.authorityTooltipHideTimeout = null
          }
        },
        scheduleAuthorityTooltipHide() {
          this.clearAuthorityTooltipHideTimeout()
          this.authorityTooltipHideTimeout = window.setTimeout(() => {
            this.showAuthorityTooltip = false
          }, 120)
        },
        async showLinkedAuthorityTooltip(event) {
          if (!this.hasLinkedAuthority) return

          const anchor = event && event.currentTarget ? event.currentTarget : this.$refs.linkButton
          this.setAuthorityTooltipPosition(anchor)
          this.clearAuthorityTooltipHideTimeout()
          this.showAuthorityTooltip = true
          await this.loadLinkedAuthorityPreview()
        },
        hideLinkedAuthorityTooltip() {
          this.scheduleAuthorityTooltipHide()
        },
        keepLinkedAuthorityTooltipOpen() {
          this.clearAuthorityTooltipHideTimeout()
        },
        getDefaultSubfieldCode() {
          const defaultSubfields = this.getDefaultSubfieldsForTag()

          return defaultSubfields.length > 0 ? defaultSubfields[0] : 'a'
        },
        addSubfield(anchorSubfield) {
          if (this.fieldReadonly) return
          if (!this.field || typeof this.field.createSubfield !== 'function') return

          const place = this.field.subfields.indexOf(anchorSubfield)
          const insertAt = place >= 0 ? place + 1 : undefined
          const newSubfield = this.field.createSubfield(this.getDefaultSubfieldCode(), insertAt)
          if (newSubfield) {
            newSubfield.value = ''
          }

          this.$emit('field-changed')
        },
        deleteSubfield(targetSubfield) {
          if (this.fieldReadonly) return
          if (!this.field || typeof this.field.deleteSubfield !== 'function') return

          // Keep at least one subfield so row controls remain available.
          if (!Array.isArray(this.field.subfields) || this.field.subfields.length <= 1) {
            return
          }

          this.field.deleteSubfield(targetSubfield)
          this.$emit('field-changed')
    },
    getSubfieldRenderKey(subfield, subfieldIdx) {
      if (!subfield || typeof subfield !== 'object') {
        return `subfield-${subfieldIdx}`
      }

      if (!subfield.__renderKey) {
        subfield.__renderKey = `subfield-${nextSubfieldRenderKeyId++}`
      }

      return subfield.__renderKey
        }
    },
    template: /* html */ `
    <div :class="[classes.container, { 'record-field-container__invalid': isFieldTagInvalid, 'record-field-container__dropdown-open': hasOpenDropdown }]">
      <div class="record-field-wrapper">
        <div class="record-field-header">
          <div
            ref="tagEl"
            :class="[classes.tag, { 'record-field-tag__invalid': isFieldTagInvalid }]"
            :title="isFieldTagInvalid ? 'Invalid field tag for this record type' : null"
            :contenteditable="!fieldReadonly"
            @keydown="keyDown"
            @input="setTag"
            @blur="finalizeTag"
          ></div>
          <div class="record-field-indicators">
            &nbsp;
            <div v-if="hasEditableIndicator1" class="indicator-1-container">
              <span 
                class="indicator indicator-editable"
                :title="'Indicator 1: ' + field.indicators[0]"
                @click="!fieldReadonly ? toggleIndicator1Menu() : null"
              >
                {{ field.indicators[0] }}
              </span>
              <div v-if="showIndicator1Menu" class="indicator-dropdown">
                <button 
                  v-for="option in indicator1Options"
                  :key="option"
                  @click="setIndicator(0, option)"
                  class="indicator-option"
                  :class="{ active: field.indicators[0] === option }"
                >
                  {{ option }}
                </button>
              </div>
            </div>
            <div v-else>
              <span class="indicator">{{ field.indicators[0] }}</span>
            </div>
            <div v-if="hasEditableIndicator2" class="indicator-2-container">
              <span 
                class="indicator indicator-editable"
                :title="'Indicator 2: ' + field.indicators[1]"
                @click="!fieldReadonly ? toggleIndicator2Menu() : null"
              >
                {{ field.indicators[1] }}
              </span>
              <div v-if="showIndicator2Menu" class="indicator-dropdown">
                <button 
                  v-for="option in indicator2Options"
                  :key="option"
                  @click="setIndicator(1, option)"
                  class="indicator-option"
                  :class="{ active: field.indicators[1] === option }"
                >
                  {{ option }}
                </button>
              </div>
            </div>
            <div v-else>
              <span class="indicator">{{ field.indicators[1] }}</span>
            </div>
            &nbsp;
          </div>
        </div>
        <div class="subfield-container">
          <record-field-subfield 
            v-for="(subfield, subfieldIdx) in field.subfields" 
            :key="getSubfieldRenderKey(subfield, subfieldIdx)" 
            :subfield="subfield"
            :field="field"
            :collection="collection"
            :tag="field.tag"
            :show-validation-state="showValidationState"
            :readonly="fieldReadonly"
            @field-changed="$emit('field-changed')"
            @add-subfield="addSubfield"
            @delete-subfield="deleteSubfield"
            @dropdown-state-changed="onSubfieldDropdownStateChanged"
            @auth-lookup="$emit('auth-lookup', { field, subfield: $event })"
            @create-authority="$emit('create-authority', { field, subfield: $event })"
          />
        </div>
        <div class="field-menu-container">
          <button
            v-if="hasLinkedAuthority"
            ref="linkButton"
            class="field-link-btn"
            type="button"
            title="Open linked authority record"
            @mouseenter="showLinkedAuthorityTooltip"
            @mouseleave="hideLinkedAuthorityTooltip"
            @focus="showLinkedAuthorityTooltip"
            @blur="hideLinkedAuthorityTooltip"
            @click.stop="openLinkedAuthority"
          >
            <i class="bi bi-link-45deg"></i>
          </button>
          <teleport to="body">
            <div
              v-if="showAuthorityTooltip && hasLinkedAuthority"
              class="field-link-tooltip"
              :style="{ top: authorityTooltipPosition.top + 'px', left: authorityTooltipPosition.left + 'px' }"
              @mouseenter="keepLinkedAuthorityTooltipOpen"
              @mouseleave="hideLinkedAuthorityTooltip"
            >
              <div v-if="authorityTooltipLoading" class="field-link-tooltip-loading">Loading authority preview...</div>
              <div v-else-if="authorityTooltipError" class="field-link-tooltip-error">{{ authorityTooltipError }}</div>
              <div v-else-if="authorityTooltipContent" class="field-link-tooltip-content">
                <div class="field-link-tooltip-id">auths/{{ authorityTooltipContent.id }}</div>
                <pre class="field-link-tooltip-mrk">{{ authorityTooltipContent.mrk || ('=LDR  [No MRK preview]') }}</pre>
              </div>
            </div>
          </teleport>
          <button class="field-menu-btn" @click.stop="toggleMenu" title="Field options">
            <i class="bi bi-three-dots-vertical"></i>
          </button>
          <div v-if="showMenu" class="field-menu-dropdown">
            <button @click="addField" class="menu-item">Add field</button>
            <button v-if="!fieldReadonly" @click="deleteField" class="menu-item">Delete field</button>
            <button v-if="!fieldReadonly" @click="deleteSelectedFields" class="menu-item">Delete selected fields</button>
          </div>
        </div>
      </div>
    </div>
  `
}