## Workflow

**startCondition:** One Task in ToDoWrite = One Linear Issue
**endCondition:** Validate with the user before beginning the next issue.

### Initial Planning

<stop-and-reflect>
Pause and consider your plan for implementation. Outline for the user the actions you will take and the basic tests you plan to execute. 
</stop-and-reflect>

### Red & Green Phase

1. **Action:** `PULL_AND_MARK_ISSUE`

   - **Details:** Using the MCP, pull the full linear issue, read it, and mark it as in progress.
   - **Fallback:** If issue cannot be found, validate issue ID with user
   - **Validation:** issue_marked_in_progress

2. **Action:** `DETERMINE_TEST_APPROACH`

   - **For Pure Refactors** (dead code removal, extraction, renaming): Skip formal testing, rely on build validation
   - **For Behavior Changes** (new features, modified functionality): Write Given-When-Then tests
   - **For UI Changes**: Update debug.html version and provide manual test checklist

3. **Action:** `IMPLEMENT_ISSUE`

   - **Validation:** implementation_complete
   - **Requirement:** Build passes, lint passes

4. **Action:** `VALIDATE_FUNCTIONALITY`
   - **For Refactors:** Build + lint validation only
   - **For Features:** Automated tests pass
   - **For UI Changes:** Manual verification checklist provided to user

### Validation Gates

**beforeImplementation:** - issue_marked_in_progress - test_approach_determined
**beforeCommit:** - Complete the validationChecklist

### Debug Version Management

For UI-related changes, always update the debug.html version number:
- Increment version to indicate what test iteration we're at
- Update title to reflect current changes being tested
- Example: "Lexical Debug v6.3 - URL Validation Extraction"

### Manual Testing Instructions Template

For UI changes, provide user with specific checklist:

```
✅ Manual Test Checklist for IAC-XXX:
Instructions:
1. Open debug.html in browser
2. Open DevTools (F12) → Console tab
3. Test specific behaviors:
   - [ ] Type URL (https://example.com) - should auto-link
   - [ ] Type email (test@test.com) - should auto-link  
   - [ ] Type ``` + space for code block
   - [ ] Add text, press Enter within block
   - [ ] Watch console for DOM structure logs
4. Compare with expected playground behavior
5. Verify no console errors or broken functionality
```

#### Refactor Phase

**section:** "linting-QA.md" - **tasks:** - Reviews the changes since the inital commmit and checks code for any issues. Performs basic linting if it does not require manual edits. Notes files that need intervention.

### Completion Protocol

Passing Make Build

- **requiredChecks:**
  1. Review Notebook under @tmp/subagents
  2. Apply all fixes and ensure tests are still green.
  3. Complete a strict build with make contracts-all as final validation.
- **finalization_action:** Mark issue [x] in ToDoWrite and 'Done' in linear.app. Commit with proper message format.

## Testing Philosophy

- **Principle:** A New Test = A New Behavior
- **Objective:** Tests should remain valid even if the module is fully refactored.
- **Mandatory Pattern:** Given-When-Then with executable assertions
- **Data Isolation:** All tests must use factory pattern for data creation to ensure parallel safety

### Good Test

**Description:** - Does the API meet its contract? Check for the export of a module, not just an endpoint's existence. Does the request make it through correctly?
**Model:** Given-When-Then
**Characteristics:** - Tests behavior, not implementation - Survives refactoring - Executable and deterministic - Clear failure messages
**Example:** - **GIVEN:** - inventory contains 10 steel - inventory contains 30 copper - **WHEN:** - consume 2 steel - consume 10 copper - purchase 5 steel - **THEN:** - inventory should contain 13 steel - inventory should contain 20 copper - purchase of 5 steel registered in expenses

### Bad Test

**Description:** A test that checks for implementation details, not behavior.
**Antipatterns:** - Testing private function implementations - Mocking behavior that should be integration tested - Hard-coding expected values without context - Testing framework behavior instead of business logic
**Example:**
Let me add these two random numbers in a function to a sum to ensure they haven't changed.

## Commit Standards

### Message Format

```Markdown
feat(IAC-XX): Brief description


Detailed explanation of changes and impact.

🤖 Generated with [Claude Code](https://claude.ai/code)

Co-Authored-By: Claude <noreply@anthropic.com>
```

### Size Limits

**maxLines:** 300
**requiresApproval:** Use `[big-commit-ok]` flag for >300 LOC

### Required Elements

IAC issue reference
Clear impact description
Test coverage confirmation
Breaking change documentation if applicable
