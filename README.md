﻿# Oдин
The best fricken card game ever. <br />
A humorous extenuation of Uno.
If you like cards against humanity you may like this. <br />
If you would like to play, go to: [odin-cards.com](http://odin-cards.com)

### A boring message from the developers:
We do not stand by any message that can be derived from this game.
All of this is just for fun and should not be taken seriously.

## How to install and run
### Linux
This will probably works on Mac too however have not tested it and don't know much about Mac computers
##### With root access:
Step 1: open terminal:
```shell
cd path/to/Odin
sudo pip3 install -r requirements.txt
sudo python3 Odin/main.py
```
Step 2: Done (:
##### Without root access:
If you don't want to run as root you need to use a virtualenv <br />
Step 1: open terminal:
```shell
cd path/to/Odin

# make the virtualenv
virtualenv odin_env

# open the virtualenv
source odin_env/bin/activate

# Install all the dependencies 
pip3 install -r requirements.txt

# run the program
python3 Odin/main.py
```
You also need change the port from 80 to something else
Step 2: open settings.py:
```python
# from this:
port = 80
# to this:
port = 12345
```

##### Run permanently
For advanced users: This is recommended if you want to deploy it to a server permanently
```
gunicorn3 -b 0.0.0.0:80 --worker-class eventlet -w 1 -p pidfile -D main:fs.app
```

### Windows
Step 1: Install python 3 <br />
Step 2: Install dependencies. In command prompt as admin:
```shell
cd path/to/Odin

:: If python is in PATH:
pip3 install -r requirements.txt

:: If python is not in PATH:
path/to/python.exe -m pip install -r requirements.txt
```
Step 3: Run the program. In command prompt:
```shell
:: If python is in PATH:
python3 Odin/main.py

:: If python is not in PATH:
path/to/python.exe Odin/main.py
```
You will probably get a popup asking to let it though your firewall.
Say yes otherwise the game will only be accessible from your computer

## How to access game
Once its running, it should give you some URLs that you can copy into your web browser of choice
(ideally firefox because its the best).
This should work on any computer in your local network.
If it doesnt you may need to let it thought your firewall or anti-virus software.<br />
If you want it to be accessible to everyone on the internet you will need to port forward the game.
This is different slightly for every network. Google your routers model number plus 'port forwarding'.
E.g. "Linksys EA8300 port forwarding". Unless you changed it, the port you are forwarding is port 80.

## For developers
We are using the PEP8 code style.
