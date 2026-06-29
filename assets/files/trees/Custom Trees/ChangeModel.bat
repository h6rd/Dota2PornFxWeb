@echo off
setlocal enabledelayedexpansion

REM source: https://discord.com/channels/984169062735151174/1416473114082279424/1416473114082279424
REM author: https://github.com/DotaModdingCommunity

set "source=tree.vmdl_c"
set "names_file=names.txt"

if not exist "%names_file%" (
    echo Error: %names_file% not found in the current directory.
    exit /b 1
)

if not exist "%source%" (
    echo Error: %source% not found.
    exit /b 1
)

for /f "usebackq delims=" %%a in ("%names_file%") do (
    set "dest_dir=%%~dpa"
    set "filename=%%~nxa.vmdl_c"
    set "full_dest_path=%%~dpb%%~nxa.vmdl_c"
    if "!dest_dir!"=="" (
        set "dest_dir=."
    )

    echo Processing: %%a

    if not exist "!dest_dir!" (
        echo   [FOLDER] Creating directory: !dest_dir!
        mkdir "!dest_dir!"
        if errorlevel 1 (
            echo   [ERROR] Failed to create directory: !dest_dir!
            goto :skip_copy
        )
    )

    copy /y "%source%" "%%a.vmdl_c" >nul
    if errorlevel 1 (
        echo   [FAIL] Could not copy to: %%a.vmdl_c
    ) else (
        echo   [SUCCESS] Copied and renamed to: %%a.vmdl_c
    )
    :skip_copy
    echo.
)

echo Done.
endlocal
pause