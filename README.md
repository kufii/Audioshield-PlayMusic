# Audioshield-PlayMusic

A Proxy server for Audioshield that replaces Soundcloud support with Play Music support. This is a fork of Audioshield-Tubifier by reddit user -olli-.

Major dependencies:  
Fiddler, a Web Debugging proxy capable of HTTPS decryption.  
Node.js, Javascript engine.

# Setting up Account

Your google account is under the restrictions of the [Node.js unofficial Play Music API](https://github.com/jamon/playmusic) I used.

>The library requires Google credentials, but does not require an All Access subscription on that account. It also requires a mobile device registered against that account. Ensure you have signed into the app on a phone and that you have played any amount of music. This will authorise the device that the library will masquerade as.

>The Google account also needs to have the "Allow less secure apps" setting set to "ON". You can change it [here](https://myaccount.google.com/security#connectedapps).

# Installation Instructions

1. Audioshield-PlayMusic is based on Node.js. To install Node.js (v6.2.0), visit https://nodejs.org/en/. Verify installation with command 'node --version' (without quotes) in Windows Command Prompt.
2. Open Windows Command Prompt and issue command `ffmpeg`. If you get a message saying the command isn't recognized, you need to install ffmpeg by downloading either 32-bit or 64-bit static version of ffmpeg from here: https://ffmpeg.zeranoe.com/builds/. Inside the zip-file you can find a bin-folder, inside which is the ffmpeg.exe -file. Copy this file to the system32 -folder which is inside your Windows folder. Close and reopen the Command Prompt and issue the same command again to verify installation.
3. Install Fiddler Web Debugger (version for .NET4) from http://www.telerik.com/fiddler. Giving a valid email address in the download form is not required. Fiddler will decrypt the HTTPS-traffic from Audioshield.
4. Install the CertMaker add-on for Fiddler: http://www.telerik.com/blogs/faq---certificates-in-fiddler. Direct link: http://fiddler2.com/r/?fiddlercertmaker.
5. Configure Fiddler to decrypt HTTPS traffic: http://docs.telerik.com/fiddler/Configure-Fiddler/Tasks/DecryptHTTPS. Let Fiddler install a Root Certificate by clicking 'Yes' twice. If you accidently hit 'No', go to 'Actions' button -> Trust Root Certificate. http://docs.telerik.com/fiddler/Configure-Fiddler/Tasks/TrustFiddlerRootCert
6. In Fiddler go to  Tools -> Fiddler Options -> HTTPS and check "ignore server certificate errors".
7. Redirect soundcloud API calls. in Fiddler, go to Tools -> Hosts. Check "Enable Remapping of Requests" and enter `localhost api.soundcloud.com` in the textbox.
8. Make sure File -> Capture Traffic is enabled in Fiddler.
9. Download a zip of this project and extract it anywhere.
10. Open a command prompt, navigate to the directory and run `npm install`
11. Open pmcred.json and enter your email and password. If you use 2 factor authentication, you can [generate an app password and use that for your password](https://support.google.com/accounts/answer/185833?hl=en). In the command prompt run `node login.js`
12. Paste the androidId and masterToken into apikey.json. You can now clear your email and password from pmcred.json.
13. Open up config.json and make sure the correct paths are set for Steam.exe and Fiddler.exe

# Launch Instructions

1. Launch start-game.bat or Audioshield-PlayMusic.exe

# Adding Launcher to SteamVR

1. Add a non steam game to your library and browse for Audioshield-PlayMusic.exe
2. Right click Audioshield-PlayMusic and click properties. Check Include in VR Library.
3. Click "Choose Icon" and browse for icon.png

# Uninstallation Instructions
1. Uninstall Fiddler through Windows Control Panel
2. Uninstall Fiddler Root certificate: issue command 'CertMgr.msc' (without quotes) in Windows Run-dialog. Navigate to folder 'Trusted Root Certification Authorities' -> 'Certificates'. Right click the 'DO_NOT_TRUST_FiddlerRoot' certificate and select 'delete'.
3. Uninstall Node.js through Windows Control Panel
4. Delete the Audioshield-PlayMusic folder





