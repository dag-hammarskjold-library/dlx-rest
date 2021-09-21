export let sidebarcomponent = {
    template: ` 
    <div class="col-2 pt-2" id="facet_sidebar" style="background-color:white;">
        <h4>Facets</h4>
        <div v-for="facet in this.facets" :key="facet.name" class="list-group" >
            <h5>{{facet.name}}</h5>
        </div>
    </div>`,
}