# Fast development with Ripple
After downloading the source code, add the android platform, for instance:

    $ cordova platform add android

Then, you can emulate the app using Ripple:

    $ ripple emulate

**Tips:**
* After you modify some app file, refresh the page by clicking the browser "Reload" button (DO NOT USE THE KEYBOARD SHORTCUT TO RELOAD THE PAGE);
* If your app is used to make cross domain requests, go to the Ripple's panel and disable the "Cross Domain Proxy" property located at the "Settings" tab.

# Developing with Eclipse + ADT

    $ cordova build
    After that, import the project into Eclipse + ADT

**Tips:**
* After you modify some app file, run the command "cordova build" again, refresh Eclipse Package Explorer tree and then run the app again;
* Use Intel x86 Atom System Image for a faster emulation.
