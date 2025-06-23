# Search History Component

## Overview
The Search History component provides users with a way to view, manage, and reuse their previous search terms. It stores search history directly within each user's document in the database for efficient data access and management.

## Features
- View list of previous search terms
- Click on a term to reuse it in the search input
- Delete individual search terms
- Clear entire search history
- Automatic sorting by most recent searches
- Responsive modal interface
- Maximum history length enforcement (100 entries)
- Duplicate term handling
- Special character support
- Unicode and emoji support

## Technical Implementation

### Frontend (Vue.js Component)
- **Component Location**: `dlx_rest/static/js/components/search-history.js`
- **Dependencies**:
  - Vue.js
  - Bootstrap 5 (for modal and styling)
  - Font Awesome (for icons)

### Backend (Python/Flask)
- **Models**:
  - `SearchHistoryEntry` (Embedded Document):
    ```python
    class SearchHistoryEntry(EmbeddedDocument):
        term = StringField(max_length=500, required=True)
        datetime = DateTimeField(default=datetime.datetime.now)
    ```
  - `User` (Document with embedded search history):
    ```python
    class User(UserMixin, Document):
        search_history = ListField(EmbeddedDocumentField(SearchHistoryEntry), default=list)
    ```

### API Endpoints
1. **GET** `/api/search-history`
   - Returns user's search history
   - Requires authentication
   - Returns sorted list by datetime (newest first)
   - Maximum 100 entries
   - ISO format datetime strings

2. **POST** `/api/search-history`
   - Adds new search term
   - Requires authentication
   - Body: `{ "term": "search term" }`
   - Handles duplicates by updating timestamp
   - Supports terms up to 500 characters

3. **DELETE** `/api/search-history/<id>`
   - Deletes specific search term
   - Requires authentication
   - Returns 404 for invalid IDs
   - Maintains history order after deletion

4. **DELETE** `/api/search-history`
   - Clears entire search history
   - Requires authentication
   - Confirms successful clearing
   - Allows immediate new entries

### Data Structure
Search history is stored as an embedded document within each user's document:
```json
{
  "email": "user@example.com",
  "search_history": [
    {
      "id": "0",
      "term": "example search",
      "datetime": "2024-03-20T10:30:00"
    }
  ]
}
```

### UI Components
1. **Search History Button**
   - Green button labeled "Search History"
   - Opens modal on click
   - Shows entry count badge

2. **Modal Interface**
   - Header: Title and entry count
   - Body: Scrollable list of search terms
   - Footer: Clear All and Close buttons
   - Dimensions: 550px width × 600px height
   - Responsive design for mobile

3. **Search History Entries**
   - Each entry shows:
     - Search term
     - Date/time of search
     - Delete button
   - Clickable to reuse the term
   - Hover effects for better UX
   - Truncation for long terms

## Usage
1. Click the "Search History" button to open the modal
2. View your previous search terms
3. Click any term to use it in the search input
4. Use the trash icon to delete individual terms
5. Use "Clear All" to remove all history
6. History automatically updates after each operation

## Security
- All endpoints require user authentication
- Users can only access their own search history
- Search history is stored within user's document for data isolation
- Input validation and sanitization
- Rate limiting on endpoints
- Secure session handling

## Performance Considerations
- Embedded document structure reduces database queries
- Automatic initialization of search_history field
- Efficient sorting and filtering of search terms
- Responsive modal design for various screen sizes
- Maximum history length enforcement
- Optimized duplicate handling
- Efficient datetime sorting
- Lazy loading of history entries

## Error Handling
- Clear error messages for invalid operations
- Graceful handling of network issues
- Automatic retry for failed operations
- User-friendly error notifications
- Proper HTTP status codes
- Detailed error logging

## Browser Support
- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)
- Mobile browsers (iOS/Android)

## Accessibility
- ARIA labels for screen readers
- Keyboard navigation support
- High contrast mode support
- Focus management
- Clear visual feedback
- Responsive text sizing 