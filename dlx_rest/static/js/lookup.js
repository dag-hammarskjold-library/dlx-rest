$(document).ready(function(){
    // Setup. We'll normally get this endpoint URL from somewhere else.
    var endpoint = '/api/bibs/lookup/700/';
    // Initialize the search object, which we'll parameterize
    var search_obj = {};
    // Construct the parameterized URL to start with
    var search_url = endpoint + $.param(search_obj);
    // Display the URL in its own div/p
    $("#search_url").text(search_url);

    // Process each subfield
    // Ideally this loops across known subfields for the field, 
    // or there's another function to add subfields with standard names.
    $(".lookup").keyup(function(){
        var field_id = $(this).attr('id');
        var filter_text = $(this).val();
        search_obj['search'] = filter_text;
        search_url = endpoint + field_id + '?' + $.param(search_obj);
        $("#search_url").text(search_url);
        var data = $.getJSON(search_url, function(data) {
            var items = [];
            $.each(data, function(key, val) {
                //console.log(val['100'][0])
                //$("#authsList").append(`<li>${JSON.stringify(val['100'][0]['subfields'])}</li>`);
                items.push( `<li id='${key}'>${JSON.stringify(val)}</li>` );
            });
            $("#authsList").html(items)
        });
    });

    /*

    $("#subfield_b").keyup(function(){
        var filter_b = $(this).val();
        search_obj['b'] = filter_b;
        search_url = endpoint + $.param(search_obj);
        $("#search_url").text(search_url);
        do_search(search_url);
    });
    */
});