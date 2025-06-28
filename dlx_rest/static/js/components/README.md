# Components for the ME application

## agenda.js
Displays a list of agenda items associate with a record. Presently called only 
from the speech review.

## auth_review.js
Specialized search interface for authority records modified since the selected 
date. Defaults to one week ago.

## basket.js
Component for displaying the contents of the user's basket. Includes 
functionality to refresh and clear the basket. Leverages the basket API to 
fetch and manipulate basket contents.

## batch_edit.js
Modal for batch editing records using basket functionality. Allows users to 
select multiple records and apply changes in bulk. Uses Jmarc for MARC record 
manipulation.

## browse.js
Complete list of records in a specific index, ordered by the index field. 
Features an endless scroll to load more records as the user scrolls down the 
page.

## count.js
Component for displaying the count of records in a search result. Can be used 
wherever you need a count of records associated with a search.

## export.js
Component for exporting records in various formats. Currently supports MARC 
output in MRK, CSV, and XML. Accessed via the search results page.

## headers.js
Serves mainly as the control menu on the search pages. 

## history_two_files_display.js
Component that displays a modal containing a record's history events, with the 
option of selecting one to display for comparison with the record'd current 
version.

## import.js
Component for importing MARC records into the system. It supports MARC in MRK, 
CSV, and XML formats. Allows users to drag and drop files or select them, and 
displays a preview of records before import. Also handles validation to ensure 
proper authority control.

## itemadd.js
Component for managing basket state via the user interface. Allows users to see 
the current status of any record in the search results (locked, in my basket, 
or not in my basket) and to add or remove records from the basket. It uses the
basket API to manage the basket state.

## merge.js
Component for merging two MARC authority records. It allows users to select two 
records that have the same heading type and merge them by selecting which 
record is the gaining record and which is the losing record. 

## messagebar.js
Component for displaying messages to the user, such as errors or warnings. 
Needs refactoring.

## name_workform.js
Component for updating the name of a workform. Displays a modal with a
text input for the new name and a save button. 

## preview.js
Component for previewing MARC records. It displays the record in a readable 
text format, allowing users to view the contents of a record without editing 
it. Will be replaced by readonly_record.js in the future.

## readonly_record.js
Component for displaying a read-only view of a MARC record. It fetches the
record from the API and displays it in a formatted manner. It is used in
various places where a read-only view of a record is needed, such as in the
search results. May be useful later for displaying records to users who don'text
have edit permissions.

## record.js
This is the main component for displaying and editing MARC records. It holds a 
record stage, a basket, and zero or more MARC record editors. It allows users
to view, edit, and save MARC records. It also handles validation and rendering
of MARC records. 

## recordfiles.js
Component for displaying files associated with a record. It allows users to 
view a list of files associated with a record and open or download them. It is 
intended to be used on the record view and inline with search results.

## search-history.js
Component for displaying the user's search history. It shows a list of previous
search queries, allowing users to quickly access and re-run past searches.
It also provides options to clear the search history or delete individual
search queries. It is used in the search component to enhance user experience
by providing quick access to previous searches.

See [search_history.md](search_history.md) for more details.

## search.js
Component for searching MARC records. It provides both a simple and advanced
search interface, allowing users to search by various fields and criteria. It 
also support sorting of results, shows the count of results, the time taken to 
search, and saves search queries to the user's search history. It also allows 
users to export results.

## select_workform.js
Component for selecting a workform when creating or editing a record. Users can 
select to create a new record from a workform or edit a workform so it can be 
used later.

## sidebar.js
Blank component for unimpleemented sidebar functionality. It is intended to be 
used as a placeholder. Presently not in use.

## sort.js
Component for sorting search results. It renders a list of sort options and 
allows users to select a field and direction for sorting. It is used in the 
search component.

## speech_review.js
Component for reviewing speeches. It displays a list of speeches and allows 
users to search and manage speeches. Includes a multi-column sort function to 
allow sorting by multiple fields.

## workform.js
Component for managing workforms. It allows users to create and edit workforms,
which are templates for creating new records. 