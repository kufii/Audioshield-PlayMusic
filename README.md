# Audioshield-PlayMusic

A Proxy server for Audioshield that replaces Soundcloud support with Play Music support. This is based off the concept of Audioshield-Tubifier by reddit user -olli-.

## Setting up Account

Your google account is under the restrictions of the [Node.js unofficial Play Music API](https://github.com/jamon/playmusic) I used.

>The library requires Google credentials. It also requires a mobile device registered against that account. Ensure you have signed into the app on a phone and that you have played any amount of music. This will authorise the device that the library will masquerade as.

>The Google account also needs to have the "Allow less secure apps" setting set to "ON". You can change it [here](https://myaccount.google.com/security#connectedapps).

## Installation Instructions

1. Audioshield-PlayMusic is based on Node.js. To install Node.js (v6.0 or above), visit https://nodejs.org/en/.
2. [Download a zip of this project](https://github.com/kufii/Audioshield-PlayMusic/archive/master.zip) and extract it anywhere.
3. Open up config.ini and make sure the correct path is set for Steam.exe.
4. Run Audioshield-PlayMusic.exe. You will be prompted for your username and app password. You can [generate an app password here](https://support.google.com/accounts/answer/185833?hl=en).

## Launch Instructions

1. Launch Audioshield-PlayMusic.exe. These launchers will launch the server, proxy, and Audioshield, and will close them all when Audioshield is closed.

## Adding Launcher to SteamVR

1. Add a non steam game to your library and browse for Audioshield-PlayMusic.exe
2. Right click Audioshield-PlayMusic and click properties. Check Include in VR Library.
3. Open Steam Big Picture Mode and navigate to Audioshield-PlayMusic.
4. Right click it and click "Set Custom Image". Browse for icon.png.

## Search Options

By default, the search will search all tracks on play music, but you can start a search with "-" to do a search command.		

* **Search by Album**: `-al <search>`. This will output the tracks of matching albums.
* **Search by Playlist**: `-pl <search>`. This will output all tracks in the matching playlists.
* **Search Thumbed Up Tracks**: `-fav <search>`. This returns all matching thumbed up tracks. The search is optional, you can exclude it to get all thumbed up tracks.
* **Search Library**: `-lib <search>`. This will return matching tracks in your library.
* **Search Uploaded**: `-up <search>`. This will return matching tracks you've uploaded.
* **Search SoundCloud**: `-sc <search>`. This will fallback to the original SoundCloud Search.

## Troubleshooting
####"When I try to select my difficulty, shield, and stage, it just loops!"
* Play music on your mobile device and try again

## Configuration

The following settings can be set in config.ini

* `Steam=<path>`: Path to Steam.exe
* `Port=<port>`: The port the proxy server will run on. Defaults to **1234**.
* `Bitrate=<bitrate>`: The bitrate of the audio stream. You can set this to a lower value if it's taking a long time to load songs. Defaults to **320**.

## Uninstallation Instructions
1. Uninstall Node.js through Windows Control Panel
2. Delete the Audioshield-PlayMusic folder
