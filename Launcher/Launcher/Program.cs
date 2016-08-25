using System;
using System.Diagnostics;
using System.Runtime.InteropServices;
using System.Threading;

namespace Launcher
{
    class Program
    {
        private static Proxy proxy = new Proxy();
        private static Process myProxy;
        private static Process myServer;
        private static bool hasCleanedUp = false;

        #region Trap application termination
        [DllImport("Kernel32")]
        private static extern bool SetConsoleCtrlHandler(EventHandler handler, bool add);

        private delegate bool EventHandler(CtrlType sig);
        static EventHandler _handler;

        enum CtrlType
        {
            CTRL_C_EVENT = 0,
            CTRL_BREAK_EVENT = 1,
            CTRL_CLOSE_EVENT = 2,
            CTRL_LOGOFF_EVENT = 5,
            CTRL_SHUTDOWN_EVENT = 6
        }

        private static bool Handler(CtrlType sig)
        {
            Console.WriteLine("Exiting system due to external CTRL-C, or process kill, or shutdown");

            // do your cleanup here
            Cleanup();

            // shutdown right away so there are no lingering threads
            Environment.Exit(-1);

            return true;
        }
        #endregion

        private static void Cleanup()
        {
            if (!hasCleanedUp)
            {
                 // Revert Proxy Settings
                proxy.ProxyServer = proxy.InitialProxyServer;
                proxy.ProxyEnabled = proxy.InitialProxyEnabled;
                proxy.RefreshSystem();
                // close processes
                if (myProxy != null && !myProxy.HasExited)
                    myProxy.Kill();
                if (myServer != null && !myServer.HasExited)
                    myServer.Kill();

                hasCleanedUp = true;

                Console.WriteLine("Cleanup complete");
            }
        }


        static void Main(string[] args)
        {
            // Some biolerplate to react to close window event, CTRL-C, kill, etc
            _handler += new EventHandler(Handler);
            SetConsoleCtrlHandler(_handler, true);

            // Process Start
            var config = new IniFile("config.ini");
            var port = config.Read("Port", "Proxy");
            var steam = config.Read("Steam", "Paths");

            try
            {
                // Start game
                Process.Start(steam, "-applaunch 412740");
                Console.WriteLine("Starting Audioshield");

                // wait for game start up
                while (true)
                {
                    var processes = Process.GetProcessesByName("Audioshield");
                    if (processes.Length > 0)
                    {
                        Console.WriteLine("Found Audioshield");
                        processes[0].WaitForInputIdle();
                        Console.WriteLine("Audioshield Started");

                        Thread.Sleep(5000);

                        // Set Proxy Settings
                        proxy.ProxyServer = "localhost:" + port;
                        proxy.ProxyEnabled = true;
                        proxy.RefreshSystem();
                        Console.WriteLine("Set Proxy");

                        // Start proxy and server
                        myProxy = Process.Start("node", "proxy.js");
                        myServer = Process.Start("node", "index.js");
                        Console.WriteLine("Started Proxy and Server");

                        processes[0].WaitForExit();
                        Console.WriteLine("Audioshield Exited");
                        break;
                    }

                    Thread.Sleep(5000);
                }
            }
            finally
            {
                Cleanup();
            }
        }
    }
}
