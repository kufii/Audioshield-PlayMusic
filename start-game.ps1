# do some sanity checks before starting
if(!(Test-Path node_modules)) {
    echo "please run 'npm install' first"
    exit
}

# functions
function ConvertFrom-Json20([object] $item){ 
    add-type -assembly system.web.extensions
    $ps_js=new-object system.web.script.serialization.javascriptSerializer

    #The comma operator is the array construction operator in PowerShell
    return ,$ps_js.DeserializeObject($item)
}

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
$file = Get-Content -Raw config.json
$config = ConvertFrom-Json20 $file

# save Audioshield process name to variable
$audioShieldProcName = "Audioshield"

# save original proxy settings
$ogProxy = Get-Proxy-Settings

Try
{
    # set proxy settings
    echo "Changing proxy settings"
    Set-Proxy-Settings "localhost:$($config.port)" $true

    # start node.js server, proxy and audioshield processes
    echo "starting Gmusic API Server, Proxy, and Audioshield"
    $serverProc = Start-Process node index.js -PassThru
    $proxyProc = Start-Process node proxy.js -PassThru
    $audioShieldProc = Start-Process $config.paths.audioshield

    # wait a few seconds to give audioshield a chance to launch
    Start-Sleep 30

    # start polling running processes for the audioshield process
    Do {
        Start-Sleep 5
        echo "checking if Audioshield is still running"
        $audioShieldRunning = Get-Process $audioShieldProcName -ErrorAction SilentlyContinue
    } While ($audioShieldRunning)

     echo "closing server and proxy"

    # once we detect that the process has closed we should close the proxy and the node.js server
    Stop-Process $serverProc.ID
    Stop-Process $proxyProc.ID
}
Catch
{
    Write-Error $_.Exception.Message
    echo "Something went wrong, resetting proxy..."
}
Finally
{
    # restore original proxy settings
    echo "restoring to original proxy: server=$($ogProxy.ProxyServer) enabled=$($ogProxy.ProxyEnable)"
    Set-Proxy-Settings $ogProxy.ProxyServer $ogProxy.ProxyEnable
}
