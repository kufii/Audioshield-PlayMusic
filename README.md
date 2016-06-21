# Audioshield-PlayMusic

A Proxy server for Audioshield that replaces Soundcloud support with Play Music support. This is a fork of Audioshield-Tubifier by reddit user -olli-.

Major dependencies:  
Fiddler, a Web Debugging proxy capable of HTTPS decryption.  
Node.js, Javascript engine.

# Setting up Account

Unfortunately your google account is under the restrictions of the [Node.js unofficial Play Music API](https://github.com/jamon/playmusic) I used.

>The library requires Google credentials, but does not require an All Access subscription on that account. It also requires a mobile device registered against that account. Ensure you have signed into the app on a phone and that you have played any amount of music. This will authorise the device that the library will masquerade as.

>The Google account also needs to have the "Allow less secure apps" setting set to "ON". You can change it [here](https://myaccount.google.com/security#connectedapps).

# Installation Instructions

1. Audioshield-PlayMusic is based on Node.js. To install Node.js (v6.2.0), visit https://nodejs.org/en/. Verify installation with command 'node --version' (without quotes) in Windows Command Prompt.
2. Download a zip of this project and extract it anywhere.
3. Open a command prompt, navigate to the directory and run `npm install`
4. Open pmcred.json and enter your email and password. In the command prompt run `node login.js`
5. Paste the androidId and masterToken into apikey.json. You can now clear your email and password from pmcred.json.
6. Open Windows Command Prompt and issue command 'ffmpeg' (without quotes). If you get a message saying the command isn't recognized, you need to install ffmpeg by downloading either 32-bit or 64-bit static version of ffmpeg from here: https://ffmpeg.zeranoe.com/builds/. Inside the zip-file you can find a bin-folder, inside which is the ffmpeg.exe -file. Copy this file to the system32 -folder which is inside your Windows folder. Close and reopen the Command Prompt and issue the same command again to verify installation.
7. Next we need to redirect api.soundcloud.com to point towards your localhost. You do this by adding the line '127.0.0.1 api.soundcloud.com' (without quotes) to your hosts file. See these instructions: http://helpdeskgeek.com/windows-7/windows-7-hosts-file/. Please note that this also means any other applications using the Soundcloud API will not work until you remove this line.
8. Install Fiddler Web Debugger (version for .NET4) from http://www.telerik.com/fiddler. Giving a valid email address in the download form is not required. Fiddler will decrypt the HTTPS-traffic from Audioshield.
9. Install the CertMaker add-on for Fiddler: http://www.telerik.com/blogs/faq---certificates-in-fiddler. Direct link: http://fiddler2.com/r/?fiddlercertmaker.
10. Configure Fiddler to decrypt HTTPS traffic: http://docs.telerik.com/fiddler/Configure-Fiddler/Tasks/DecryptHTTPS. Let Fiddler install a Root Certificate by clicking 'Yes' twice. If you accidently hit 'No', go to 'Actions' button -> Trust Root Certificate. http://docs.telerik.com/fiddler/Configure-Fiddler/Tasks/TrustFiddlerRootCert
11. 

# Launch Instructions

1. Open the Windows Command Prompt and navigate to the directory where Audioshield-PlayMusic was installed.
2. Type into the command prompt: `node index.js`. You should see the text "Server running" displayed.
3. Start Fiddler and select File -> Capture Traffic to start HTTPS decryption.
4. Start Audioshield and do a song search. Fiddler should prompt for an invalid certificate, click Yes to accept. This has to be done once every time Fiddler is started. Tip: use desktop view in Vive dashboard.
5. Enjoy Audioshield with Play Music

# Uninstallation Instructions
1. Remove the line '127.0.0.1 api.soundcloud.com' from your hosts file
2. Uninstall Fiddler through Windows Control Panel
3. Uninstall Fiddler Root certificate: issue command 'CertMgr.msc' (without quotes) in Windows Run-dialog. Navigate to folder 'Trusted Root Certification Authorities' -> 'Certificates'. Right click the 'DO_NOT_TRUST_FiddlerRoot' certificate and select 'delete'.
4. Uninstall Node.js through Windows Control Panel
5. Delete the Audioshield-PlayMusic folder





