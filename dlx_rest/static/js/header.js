/////////////////////////////////////////////////////////////////
// IMPORTS
/////////////////////////////////////////////////////////////////
import { modalmergecomponent } from "./merge.js";

/////////////////////////////////////////////////////////////////
// HEADER COMPONENT
/////////////////////////////////////////////////////////////////
export let headercomponent = {
    props: ["api_prefix", "header_type"],
    template: `
    <nav class="navbar navbar-expand-lg navbar-light bg-light">
        <span class="navbar-brand">Editor Menu</span>
        <button class="navbar-toggler" type="button" data-toggle="collapse" data-target="#navbarSupportedContent" aria-controls="navbarSupportedContent" aria-expanded="false" aria-label="Toggle navigation">
        <span class="navbar-toggler-icon"></span>
        </button>

        <div class="collapse navbar-collapse" id="navbarSupportedContent">
        <ul class="navbar-nav mr-auto">
            <li class="nav-item active dropdown">
                <a class="nav-link dropdown-toggle" href="#" id="navbarDropdown" role="button" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                    Create Record
                </a>
                <div class="dropdown-menu" aria-labelledby="navbarDropdown">
                    <a href="#" class="dropdown-item" data-toggle="modal" data-target="#select-auths-WorkformModal">Auth Record</a>
                    <a href="#" class="dropdown-item" data-toggle="modal" data-target="#select-bibs-WorkformModal">Bib Record</a>
                    <a href="#" class="dropdown-item disabled" data-toggle="modal" data-target="#select-bibs-WorkformModal">Speech Record</a>
                    <a href="#" class="dropdown-item disabled" data-toggle="modal" data-target="#select-bibs-WorkformModal">Voting Record</a>
                </div>
            </li>
            <li class="nav-item active">
                <a class="nav-link" href="#"  id="show-modal" @click="displayModal" >Authorities Merge <span class="sr-only">(current)</span></a>
            </li>
        </ul>
        <div class="search-box">
            <form class="form-inline" :action="action">
                <div class="input-group">
                    <div class="input-group-prepend">
                        <button id="searchCollection" class="btn btn-outline-dark dropdown-toggle" type="button" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">Bibs</button>
                        <div class="dropdown-menu">
                            <a class="dropdown-item" href="#" @click="setSearchCollection('bibs')">Bibs</a>
                            <a class="dropdown-item" href="#" @click="setSearchCollection('auths')">Auths</a>
                            <a class="dropdown-item disabled" href="#">Files</a>
                        </div>
                    </div>
                    <input id="q" name="q" class="form-control" type="search" placeholder="Search" aria-label="Search">
                    <div class="input-group-append">
                        <a class="btn btn-outline-success" type="submit" @click="submitSearch">Search</a>
                    </div>
                </div>
            </form>
        </div>
        </div>
    </nav>`,
    data: function () {

        let uibase = this.api_prefix.replace("/api","");
        return {
            visible: true,
            uibase: uibase,
            searchCollection: "bibs",
            action: null
        }
    },
    created: async function () {
        this.action = `${this.uibase}/records/${this.searchCollection}/search`;
    },
    methods:{
      displayModal(){
        modalmergecomponent.methods.toggleModal()
      },
      setSearchCollection(collection) {
          let el = document.getElementById("searchCollection");
          el.innerText = collection;
          this.searchCollection = collection;
          this.action = `${this.uibase}/records/${this.searchCollection}/search`;
      },
      submitSearch() {
          let searchString = document.getElementById('q').value
          let searchUrl = `${this.action}?q=${searchString}`
          window.open(searchUrl, "_blank")
      }
    },
    components: {
        'modalmergecomponent': modalmergecomponent
    }
  }