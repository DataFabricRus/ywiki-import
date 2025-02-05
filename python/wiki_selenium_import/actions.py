import pyperclip
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys
import time

from xpaths import ADD_ROOT_PAGE_BUTTON, LOGIN_WIKI_BUTTON, LOGIN_YANDEX_ID_BUTTON, LOGIN_INPUT, PASSWORD_INPUT, \
    PAGE_NAME_INPUT, CREATE_PAGE_BUTTON, PAGE_CONTENT_EDITOR, SAVE_PAGE_BUTTON, OPEN_PAGE_ACTIONS_MENU, \
    CREATE_SUBPAGE_MENU_ITEM


def click_button(driver, xpath, delay = 2):
    button = driver.find_element(By.XPATH, xpath)
    button.click()
    time.sleep(delay)

def fill_input_and_return(driver, xpath, text, delay = 2):
    elem = driver.find_element(By.XPATH, xpath)
    elem.send_keys(text)
    elem.send_keys(Keys.RETURN)
    time.sleep(delay)

def fill_input(driver, xpath, text):
    elem = driver.find_element(By.XPATH, xpath)
    elem.send_keys(text)

def create_subpage(driver, name, md_file):
    click_button(driver, OPEN_PAGE_ACTIONS_MENU)
    click_button(driver, CREATE_SUBPAGE_MENU_ITEM)
    create_page(driver, name, md_file)

def create_root_page(driver, name, md_file = None):
    click_button(driver, ADD_ROOT_PAGE_BUTTON)
    create_page(driver, name, md_file)

def create_page(driver, name, md_file = None):
    fill_input(driver, PAGE_NAME_INPUT, name)
    time.sleep(2)
    click_button(driver, CREATE_PAGE_BUTTON)

    if md_file:
        with open(md_file, "r", encoding="utf-8") as file:
            md_content = file.read()

        paste_through_clipboard(driver, PAGE_CONTENT_EDITOR, md_content)
        click_button(driver, SAVE_PAGE_BUTTON)

def paste_through_clipboard(driver, xpath, content):
    pyperclip.copy(content)
    elem = driver.find_element(By.XPATH, xpath)
    elem.send_keys(Keys.COMMAND, 'v')
    time.sleep(1)
    # editor.send_keys(Keys.CONTROL, "v")  # Для Windows/Linux

def xpath_exists(driver, xpath):
    elems = driver.find_elements(By.XPATH, xpath)
    return len(elems) > 0

def login_wiki(driver):
    click_button(driver, LOGIN_WIKI_BUTTON)
    click_button(driver, LOGIN_YANDEX_ID_BUTTON)

    if xpath_exists(driver, LOGIN_INPUT):
        fill_input_and_return(driver, LOGIN_INPUT, "rbelchenko@datafabric.su")

    fill_input_and_return(driver, PASSWORD_INPUT, "Datafabric")