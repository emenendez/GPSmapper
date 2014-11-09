GPSmapper
=========

This app is a simple tool to visualize GPS tracks on a web map with minimal effort. All GPX files in the app's Dropbox folder are automatically displayed on the map.

Usage
-----

1. Visit https://emenendez.github.io/GPSmapper/ in your browser and sign in to Dropbox to link the app with your Dropbox account.

2. Place GPX files in the app's folder in your Dropbox:  
   `Dropbox/Apps/GPSmapper/`

3. Observe the web map at https://emenendez.github.io/GPSmapper/.

Streamlined GPS workflow
------------------------

Use GPSmapper with [gpxutils](https://github.com/emenendez/gpxutils) for a simple, efficient GPS workflow:

1. Link GPSmapper to your Dropbox account by visiting https://emenendez.github.io/GPSmapper/.

2. [Install gpxutils](https://github.com/emenendez/gpxutils#installation)

3. Modify the last block in your USBDLM.ini file to match the following:

        [OnArrival1]
        FileExists=%drive%\Garmin\GPX
        open="gpxpull" -o "C:\Users\YOUR-USERNAME\Dropbox\Apps\GPSmapper\" %drive%
  
   Where `C:\Users\YOUR-USERNAME\Dropbox\Apps\GPSmapper\` is the path to the GPSmapper folder in your Dropbox.

4. Attach any modern Garmin GPS and observe the tracks displayed at https://emenendez.github.io/GPSmapper/.
