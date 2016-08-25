using Microsoft.Win32;
using System;
using System.Runtime.InteropServices;

namespace Launcher
{
    public class Proxy
    {
        [DllImport("wininet.dll")]
        public static extern bool InternetSetOption(IntPtr hInternet, int dwOption, IntPtr lpBuffer, int dwBufferLength);
        public const int INTERNET_OPTION_SETTINGS_CHANGED = 39;
        public const int INTERNET_OPTION_REFRESH = 37;
        private bool _settingsReturn, _refreshReturn;
        private RegistryKey _registry;

        public Proxy()
        {
            var currentUserRegistry = RegistryKey.OpenBaseKey(RegistryHive.CurrentUser,
                Environment.Is64BitOperatingSystem
                    ? RegistryView.Registry64
                    : RegistryView.Registry32);
            _registry = currentUserRegistry.OpenSubKey(@"Software\Microsoft\Windows\CurrentVersion\Internet Settings", true);
            InitialProxyServer = ProxyServer;
            InitialProxyEnabled = ProxyEnabled;
        }

        public string InitialProxyServer { get; private set; }
        public bool InitialProxyEnabled { get; private set; }

        public string ProxyServer
        {
            get
            {
                return _registry.GetValue("ProxySever") as string;
            }
            set
            {
                _registry.SetValue("ProxyServer", value == null ? "" : value);
            }
        }

        public bool ProxyEnabled
        {
            get
            {
                return Convert.ToInt32(_registry.GetValue("ProxyEnable")) == 1;
            }
            set
            {
                _registry.SetValue("ProxyEnable", value ? 1 : 0);
            }
        }

        public void RefreshSystem()
        {
            _settingsReturn = InternetSetOption(IntPtr.Zero, INTERNET_OPTION_SETTINGS_CHANGED, IntPtr.Zero, 0);
            _refreshReturn = InternetSetOption(IntPtr.Zero, INTERNET_OPTION_REFRESH, IntPtr.Zero, 0);
        }
    }
}
