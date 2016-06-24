# do some sanity checks before starting
if(!(Test-Path node_modules)) {
    echo "please run 'npm install' first"
    exit
}

# load config file
$config = Get-Content -Raw config.json | ConvertFrom-Json

# save Audioshield process name and steam id to variables
$audioShieldSteamId = 412740
$audioShieldProcName = "Audioshield"

# start node.js server, fiddler and audioshield processes
echo "starting Gmusic API Server, Fiddler, and Audioshield"
$serverProc = Start-Process node index.js -PassThru
$fiddlerProc = Start-Process $config.paths.fiddler -PassThru
$audioShieldProc = Start-Process $config.paths.steam "-applaunch",$audioShieldSteamId -PassThru

# wait a few seconds to give audioshield a chance to launch
Start-Sleep 30

# start polling running processes for the audioshield process
Do {
    Start-Sleep 5
    echo "checking if Audioshield is still running"
    $audioShieldRunning = Get-Process $audioShieldProcName -ErrorAction SilentlyContinue
} While ($audioShieldRunning)

echo "Audioshield closed, closing server and Fiddler"

# once we detect that the process has closed we should close fiddler and the node.js server
Stop-Process $serverProc.ID
$fiddlerProc.CloseMainWindow()
