
<div align="center">
<h1>google-meet-visitor <sup>7.0.2</sup></h1>
<img  src="./assets/logo.png">
</div>

# Documentation Content
1. [What it does?][1]
    1) [Demo][1.1]
2. [Requirements][2]
3. [Supported Systems][3]
4. [Usage][4]
    1) [Installation][4.1]
    2) [Configuration][4.2]
        1) [Explanation of variables][4.2.1]
        2) [Configuration by arguments][4.2.2]
    3) [Run][4.3]
    4) [Record calls][4.4]
5. [FAQ][5]
    1) [How to get path for USER_DATA_DIR?][5.1]
    2) [Why does webdriver of visitor use minimized option instead of headless?][5.2]
6. [Contribution][6]
7. [License][7]

# What it does
The main purpose of the google-meet-visitor is just to visit calls in google meet. The main feature is that you can record calls. It will automate all the user actions, i.e join a call, mute the browser micro and cam, submit that you are in the call, etc.

# Demo
### Here's example video recorded by google-meet-visitor for 1-minute call. Audio is also supported.
<div align="center">
    <img src="./assets/demo.gif" width="500px" height="500px">
</div>

# Requirements
<div>
	<img alt="" src="https://badgen.net/badge/Google Chrome/>=100/green">
	<img alt="" src="https://badgen.net/badge/node.js/>=18/purple">
	<img alt="" src="https://badgen.net/badge/selenium/>=4.1.13/red">
</div>

# Supported systems
<div>
	<img alt="" src="https://badgen.net/badge/Windows/any/yellow">
	<img alt="" src="https://badgen.net/badge/Linux/any/pink">
	<img alt="" src="https://badgen.net/badge/MacOS/any/blue">
</div>

# Usage
## Installation
    git clone git@github.com:KR1470R/google-meet-visitor.git
    npm ci

## Configuration
All the config parameters are stored in the .env file in root of the project.\
Variables with asterisk* are important, you won't be able to run the program without them!

### Explanation of variables:
***USER_DATA_DIR**** - specify the path to your google chrome profile directory. [See here][5.1].\
***TARGET_CALL_LINK**** - link to your google meet call.\
***CALL_TIMER_MINUTES**** - how many minutes the visitor must stay at call\
***OUTPUT_RECORD_TAB*** - custom path to folder for output records. By default is `dist/records/` in the root.\
***WIDTH_PX*** - width of browser window. By default 1000.\
***HEIGHT_PX*** - height of browser window. By default 800.\
***MINIMIZED*** - true or false. If true, the window of the browser will be minimized and if false - maximized. By default false.\
***MUTE*** - true or false. If true, the browser will be totally muted. By default false.\
***RECORD_TAB*** - true or false. If true, the visitor will record the call. By default false.\
***ASK_JOIN_WAIT_MIN*** - how many minutes await for host of call accept your "ask to join" request(default 10).\
***IGNORE_ERRORS*** - skip printing errors(aka "some element not found", etc) - true/false(default false, recomended for debuging).\
***GMEET_MIC_MUTE*** - mute gmeet micro, by default false.\
***GMEET_CAM_MUTE*** - mute gmeet webcam, by default false.


###  Configuration by arguments
You also can specify your link to call, user profile path and other config parameters by directly specifying such command-line arguments.\
⚠️Note that command-line arguments will override parameters you specified in .env file!⚠️

##### List of arguments that overrides .env variables:
`--user-data-dir=` **or**  `--u=`  overrides ***USER_DATA_DIR***\
`--target-call-link=` **or**  `--t=` overrides ***TARGET_CALL_LINK***\
`--call-timer-minutes=`**or** `--timer=` overrides ***CALL_TIMER_MINUTES***\
`--output-record-tab=` **or** `--o` overrides ***OUTPUT_RECORD_TAB***\
`--minimized` overrides ***MINIMIZED***\
`--mute` overrides ***MUTE***\
`--record-tab` **or** `--r` - overrides ***RECORD_TAB***\
`--width=` **or** `--w=` overrides ***WIDTH_PX***\
`--height=` **or** `--h=` overrides ***HEIGHT_PX***\
`--ask-to-join-wait=` **or** `--ask-min=` overrides ***ASK_JOIN_WAIT_MIN***\
`--ignore-errors` **or** `--i` overrides ***IGNORE_ERRORS***\
`--gmeet-mic-mute` **or** `--gmm` overrides ***GMEET_MIC_MUTE***\
`--gmeet-cam-mute` **or** `--gcm` overrides ***GMEET_CAM_MUTE***

#### Example usage in CLI:

    npm run start -- --u="path/to/user-data-dir/" --t="https://meet.google.com/..." --timer="50" --o="/path/to/output/folder/" --minimized --mute --r --w=1000 --h=800 --ask-min=123 --i
⚠️Do not forget specify `--` after `npm run start`.
## Run

‼️Before running the visitor, ensure that you have signed in your account.‼️\
⚠️It might ask you to login again to ensure that it's you, otherwise visitor will recognize it and give you 5 minutes for login.
Just go to the root directory of the google-meet-visitor and type the command:

    npm run make # build the program, run after every changes you made in the project.
    npm run start # run the visitor, you have not build the project every time if you have already build it.

✅To stop the program before he finishes work, click `Ctrl+C` - the visitor will save a video(if recording) and stop immediately!
# FAQ
## How to get path for ***USER_DATA_DIR***?

The main purpose of using user data directory is to automate authorization of user in google meet. Don't worry, it doesn't steal your data.
1. Open your google chrome.
2. Open this link `chrome://version/`
3. Copy the path in a **Profile Path** row and paste to your ***USER_DATA_DIR*** variable.

<img align="center"  src="./assets/profile_path.png">

## Failed to start: unknown error: Chrome failed to start: exited normally.
This occurs because chromedriver requires 0 opened Chrome instances.
To fix that problem, you need to close all Chrome instances and run the program again.


## Why does webdriver of visitor use minimized option instead of headless?
Well, on the initial stages of the development that was thought that visitor should run with headless option, at least for non-recording mode. But, i faced with a lot of problem by doing it, i couldn't even join to call with headless mode, i have tried a lot of options, nevertheless google meet just have blocked it. So the only solution i came up with is just use minimized mode.

# TODO
- [ ] Fix corruption in leaving when user leaves by Ctrl-C.

# Contribution
### I would be very glad for your contributions. Any questions, issues and suggestions will welcome!
### Feel free to create new issues🙃
# License
<div>
	<img src="https://camo.githubusercontent.com/d5b96d374ea9039f533b8fbb39e8e56964e9281dbf80315b7cef7242a1a21512/68747470733a2f2f6d6972726f72732e6372656174697665636f6d6d6f6e732e6f72672f70726573736b69742f627574746f6e732f38387833312f7376672f62792d6e632e737667">
	<img src="https://upload.wikimedia.org/wikipedia/commons/f/f8/License_icon-mit-88x31-2.svg">
</div>

[1]:https://github.com/KR1470R/google-meet-visitor#what-it-does
[1.1]:https://github.com/KR1470R/google-meet-visitor#demo
[2]:https://github.com/KR1470R/google-meet-visitor#requirements
[3]:https://github.com/KR1470R/google-meet-visitor#supported-systems
[4]:https://github.com/KR1470R/google-meet-visitor#usage
[4.1]:https://github.com/KR1470R/google-meet-visitor#installation
[4.2]:https://github.com/KR1470R/google-meet-visitor#configuration
[4.2.1]:https://github.com/KR1470R/google-meet-visitor#explanation-of-variables
[4.2.2]:https://github.com/KR1470R/google-meet-visitor#configuration-by-arguments
[4.3]:https://github.com/KR1470R/google-meet-visitor#run
[4.4]:https://github.com/KR1470R/google-meet-visitor#record-calls
[5]:https://github.com/KR1470R/google-meet-visitor#faq
[5.1]:https://github.com/KR1470R/google-meet-visitor#how-to-get-path-for-user_data_dir
[5.2]:https://github.com/KR1470R/google-meet-visitor#why-does-webdriver-of-visitor-use-minimized-option-instead-of-headless
[6]:https://github.com/KR1470R/google-meet-visitor#contribution
[7]:https://github.com/KR1470R/google-meet-visitor#license
