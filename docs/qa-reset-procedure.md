# QA Reset Procedure

To perform a true fresh-install test and verify the initial setup wizard, follow these steps:

1. **Stop all Vyora/Electron processes.**
   Ensure that the application is completely closed and no background processes remain active.

2. **Delete the entire AppData directory.**
   Remove the Vyora configuration and database directory (e.g., `%APPDATA%\Vyora` on Windows, or `~/.config/Vyora` on Linux).

3. **Verify the directory no longer exists.**
   Confirm that the folder is completely removed to ensure no legacy state persists.

4. **Install and launch the application.**
   Start Vyora to initiate the clean state.

### Expected State on Clean Launch

- **Users:** 0
- **Companies:** 0
- **Sessions:** 0

### Expected Flow

1. Splash Screen
2. Setup Wizard
3. Create Administrator
4. Create Company
5. Dashboard
