# Audioshield-PlayMusic

A Proxy server for Audioshield that replaces Soundcloud support with Play Music support. This is a fork of Audioshield-Tubifier by reddit user -olli-.

Major dependencies: 
* Node.js, Javascript engine.
* ffmpeg

# Setting up Account

Your google account is under the restrictions of the [Node.js unofficial Play Music API](https://github.com/jamon/playmusic) I used.

>The library requires Google credentials, but does not require an All Access subscription on that account. It also requires a mobile device registered against that account. Ensure you have signed into the app on a phone and that you have played any amount of music. This will authorise the device that the library will masquerade as.

>The Google account also needs to have the "Allow less secure apps" setting set to "ON". You can change it [here](https://myaccount.google.com/security#connectedapps).

# Installation Instructions

1. Audioshield-PlayMusic is based on Node.js. To install Node.js (v6.2.0), visit https://nodejs.org/en/. Verify installation with command 'node --version' (without quotes) in Windows Command Prompt.
2. Open Windows Command Prompt and issue command `ffmpeg`. If you get a message saying the command isn't recognized, you need to install ffmpeg by downloading either 32-bit or 64-bit static version of ffmpeg from here: https://ffmpeg.zeranoe.com/builds/. Inside the zip-file you can find a bin-folder, inside which is the ffmpeg.exe -file. Copy this file to the system32 -folder which is inside your Windows folder. Close and reopen the Command Prompt and issue the same command again to verify installation.
3. [Download a zip of this project](https://github.com/kufii/Audioshield-PlayMusic/archive/master.zip) and extract it anywhere.
4. Open a command prompt, navigate to the directory and run `npm install`
5. Make sure your Google account has the "Allow less secure apps" setting set to "ON". You can change it [here](https://myaccount.google.com/security#connectedapps).
6. Run `node login.js`. Enter your email and password. If you use 2 factor authentication, you can [generate an app password and use that for your password](https://support.google.com/accounts/answer/185833?hl=en).
7. Open up config.json and make sure the correct path is set for Steam.exe 

# Launch Instructions

1. Launch start-game.bat or Audioshield-PlayMusic.exe. These launchers will launch the server, proxy, and Audioshield, and will close them all when Audioshield is closed.

# Adding Launcher to SteamVR

1. Add a non steam game to your library and browse for Audioshield-PlayMusic.exe
2. Right click Audioshield-PlayMusic and click properties. Check Include in VR Library.
3. Open Steam Big Picture Mode and navigate to Audioshield-PlayMusic.
4. Right click it and click "Set Custom Image". Browse for icon.png.

# Search Options

By default, the search will search all tracks on play music, but you can start a search with "-" to do a search command.		

* **Search by Album**: `-al <search>`. This will output the tracks of matching albums.
* **Search by Playlist**: `-pl <search>`. This will output all tracks in the matching playlists.
* **Search Thumbed Up Tracks**: `-fav <search>`. This returns all matching thumbed up tracks. The search is optional, you can exclude it to get all thumbed up tracks.
* **Search Library**: `-lib <search>`. This will return matching tracks in your library.
* **Search Uploaded**: `-up <search>`. This will return matching tracks you've uploaded.

# Uninstallation Instructions
1. Uninstall Node.js through Windows Control Panel
2. Delete the Audioshield-PlayMusic folder





