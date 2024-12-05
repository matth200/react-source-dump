# REACT-SOURCE-DUMP

This tool is designed to get the frontend source code of a website working with react.

## Installation

You must have npm installed on your machine. 
Also install the lib for npm.  
```bash
$ npm install
```

You must have python3 installed and some lib on your machine.
```bash
$ python3 -m pip install requests beautifulsoup4
```

## TO DO

- Make the code only nodejs or python3
- Improve option of the script
- Improve also the verbose of the script
- Make venv for python3


## Avoid making the tool working

You go in your react project and you put a .env file with GENERATE_SOURCEMAP=false.

## How to use it


```bash
$ python3 react-source-dump.py url output_folder
 _______    ______           _______   __    __  __       __  _______  
/       \  /      \         /       \ /  |  /  |/  \     /  |/       \ 
$$$$$$$  |/$$$$$$  |        $$$$$$$  |$$ |  $$ |$$  \   /$$ |$$$$$$$  |
$$ |__$$ |$$ \__$$/  ______ $$ |  $$ |$$ |  $$ |$$$  \ /$$$ |$$ |__$$ |
$$    $$< $$      \ /      |$$ |  $$ |$$ |  $$ |$$$$  /$$$$ |$$    $$/ 
$$$$$$$  | $$$$$$  |$$$$$$/ $$ |  $$ |$$ |  $$ |$$ $$ $$/$$ |$$$$$$$/  
$$ |  $$ |/  \__$$ |        $$ |__$$ |$$ \__$$ |$$ |$$$/ $$ |$$ |      
$$ |  $$ |$$    $$/         $$    $$/ $$    $$/ $$ | $/  $$ |$$ |      
$$/   $$/  $$$$$$/          $$$$$$$/   $$$$$$/  $$/      $$/ $$/   

---------------------------------------------------------------------
Tool to dump react source from a website
```
