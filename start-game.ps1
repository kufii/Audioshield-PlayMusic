# do some sanity checks before starting
if(!(Test-Path node_modules)) {
    echo "please run 'npm install' first"
    exit
}

# functions
function Get-Proxy-Settings()
{
    $reg = "HKCU:\Software\Microsoft\Windows\CurrentVersion\Internet Settings"
    Get-ItemProperty -Path $reg
}

function Set-Proxy-Settings()
{
    $server = $args[0]
    $enabled = $args[1]
    $reg = "HKCU:\Software\Microsoft\Windows\CurrentVersion\Internet Settings"
    Set-ItemProperty -Path $reg -Name ProxyServer -Value $server
    Set-ItemProperty -Path $reg -Name ProxyEnable -Value $enabled
    Refresh-System
}

function Refresh-System() {
    $signature = @'
[DllImport("wininet.dll", SetLastError = true, CharSet=CharSet.Auto)]
public static extern bool InternetSetOption(IntPtr hInternet, int dwOption, IntPtr lpBuffer, int dwBufferLength);
'@

    $INTERNET_OPTION_SETTINGS_CHANGED   = 39
    $INTERNET_OPTION_REFRESH            = 37
    $type = Add-Type -MemberDefinition $signature -Name wininet -Namespace pinvoke -PassThru
    $a = $type::InternetSetOption(0, $INTERNET_OPTION_SETTINGS_CHANGED, 0, 0)
    $b = $type::InternetSetOption(0, $INTERNET_OPTION_REFRESH, 0, 0)
    return $a -and $b
}

# load config file
$config = Get-Content -Raw config.json | ConvertFrom-Json

# save Audioshield process name and steam id to variables
$audioShieldSteamId = 412740
$audioShieldProcName = "Audioshield"

# save original proxy settings
$ogProxy = Get-Proxy-Settings

# set proxy settings
Set-Proxy-Settings "localhost:$($config.port)" $true

# start node.js server, proxy and audioshield processes
echo "starting Gmusic API Server, Proxy, and Audioshield"
$serverProc = Start-Process node index.js -PassThru
$proxyProc = Start-Process node proxy.js -PassThru

# for some reason my display driver crashes if I don't do a short sleep before launching audioshield
Start-Sleep 3
$audioShieldProc = Start-Process $config.paths.steam "-applaunch",$audioShieldSteamId -PassThru

# wait a few seconds to give audioshield a chance to launch
Start-Sleep 30

# start polling running processes for the audioshield process
Do {
    Start-Sleep 5
    echo "checking if Audioshield is still running"
    $audioShieldRunning = Get-Process $audioShieldProcName -ErrorAction SilentlyContinue
} While ($audioShieldRunning)

echo "Audioshield closed, closing server and proxy"

# once we detect that the process has closed we should close the proxy and the node.js server
Stop-Process $serverProc.ID
Stop-Process $proxyProc.ID

# restore original proxy settings
echo "restoring to original proxy: server=$($ogProxy.ProxyServer) enabled=$($ogProxy.ProxyEnable)"
Set-Proxy-Settings $ogProxy.ProxyServer $ogProxy.ProxyEnable