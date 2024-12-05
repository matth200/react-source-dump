import os
import sys
import argparse
import requests
from bs4 import BeautifulSoup
from urllib.parse import urljoin, urlparse

def execute_source_file(folder):
    os.system(f"nodejs main.js -i '{folder}'")

def fetch_and_download_js(url, output_folder):
    map_files_downloaded = False  

    try:
        response = requests.get(url)
        response.raise_for_status() 

        soup = BeautifulSoup(response.text, 'html.parser')

        scripts = soup.find_all('script')

        os.makedirs(output_folder, exist_ok=True)

        for script in scripts:
            if script.attrs.get('src'):  
                js_url = urljoin(url, script['src']) 
                print(f"Fetching JavaScript source: {js_url}")
                
                js_response = requests.get(js_url)
                js_response.raise_for_status()

                js_filename = os.path.basename(urlparse(js_url).path)
                js_path = os.path.join(output_folder, js_filename)
                with open(js_path, 'w', encoding='utf-8') as js_file:
                    js_file.write(js_response.text)
                print(f"Saved JavaScript to: {js_path}")

                map_url = js_url + ".map"
                print(f"Checking for map file: {map_url}")
                map_response = requests.get(map_url)
                if map_response.status_code == 200:
                    map_path = js_path + ".map"
                    with open(map_path, 'w', encoding='utf-8') as map_file:
                        map_file.write(map_response.text)
                    print(f"Saved map file to: {map_path}")
                    map_files_downloaded = True  
                else:
                    print(f"No map file found for: {js_url}")

    except requests.RequestException as e:
        print(f"Error fetching URL {url}: {e}")
    
    return map_files_downloaded

def main():
    parser = argparse.ArgumentParser(description="Download JavaScript files and their .map files from a website.")
    parser.add_argument("url", type=str, help="The URL of the website to scrape.")
    parser.add_argument("output_folder", type=str, help="The folder to save the downloaded files.")

    args = parser.parse_args()

    map_files_downloaded = fetch_and_download_js(args.url, args.output_folder)

    if map_files_downloaded:
        print("\033[92mAll .map files were successfully downloaded. Executing the source file...\033[0m")
        execute_source_file(args.output_folder)
    else:
        print("\033[91mNo .map files were found. Cannot execute the source file.\033[0m")

if __name__ == "__main__":
    main()
