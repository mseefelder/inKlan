# inKlan

## Node.js setup on Linux (the way we did it):
- First, create a local folder on your home where you wish to install node to:
	- `mkdir $HOME/local`
	- we install on this folder so that you don't ever have to sudo when using node or npm
- Now go into a folder where you want to clone the node repository to
	- It doesn't need to be the local folder we created
- `git clone https://github.com/joyent/node.git`
- `git fetch`
- `git checkout v0.12.7-release`
- `./configure --prefix=$HOME/local ./configure --with-intl=full-icu --download=all`
	- The command above configures the installation to be on the local folder, and some other stuff
	- For more information check https://github.com/joyent/node
- `make install`
- Now you're ready to go!

## Running inKlan:
- Go into the inKlan folder and:
- `node server.js`
- Open one (or several) browser (s) and open localhost:3000
- To draw, click on canvas;
- To make a line or polygon from the points, click one of the buttons.
