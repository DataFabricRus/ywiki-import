from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys
import time

from actions import click_button, fill_input_and_return, create_root_page, xpath_exists, login_wiki, create_subpage
from xpaths import LOGIN_WIKI_BUTTON, LOGIN_YANDEX_ID_BUTTON, LOGIN_INPUT, LOGIN_SUBMIT, PASSWORD_INPUT, PASSWORD_SUBMIT


def run():
    # Путь к вашему MD-файлу

    # Путь к вашему профилю Chrome
    chrome_profile_path = "~/Library/Application Support/Google/Chrome"

    # Открываем и читаем содержимое MD-файла

    # Настройки браузера
    options = webdriver.ChromeOptions()
    options.add_argument("--start-maximized")
    options.add_argument("profile-directory=Profile 1")  # Название папки профиля, например "Profile 1"

    options.add_argument(f"user-data-dir={chrome_profile_path}")  # Путь к папке с профилем
    options.add_argument("profile-directory=Default")  # Название папки профиля (по умолчанию - Default)

    # Запуск браузера
    driver = webdriver.Chrome(options=options)

    try:
        # 1️⃣ Открываем Yandex Wiki
        driver.get("https://wiki.yandex.ru")

        if xpath_exists(driver, LOGIN_WIKI_BUTTON):
            login_wiki(driver)



        create_root_page(driver, 'astu', "/Users/belch/test/page.md")
        create_subpage(driver, 'astu', "/Users/belch/test/page.md")

        # 2️⃣ Авторизация (если требуется)
        # Найдите поле ввода логина и пароля (если вы не залогинены)
        # Пример для Yandex Passport (нужно протестировать)
        # if "passport.yandex.ru" in driver.current_url:
        #     login_input = driver.find_element(By.NAME, "login")
        #     login_input.send_keys("your_login")  # Замените на свой логин
        #     login_input.send_keys(Keys.RETURN)
        #     time.sleep(2)  # Ждем загрузку пароля
        #
        #     password_input = driver.find_element(By.NAME, "passwd")
        #     password_input.send_keys("your_password")  # Замените на свой пароль
        #     password_input.send_keys(Keys.RETURN)
        #     time.sleep(3)  # Ждем авторизацию`````

        # 3️⃣ Переход в нужное пространство (можно вручную указать ссылку)
        # driver.get("https://wiki.yandex.ru/spaces/12345/pages")  # Укажите свое пространство
        # time.sleep(2)

        # 4️⃣ Нажимаем кнопку "Создать страницу"
        #create_button = driver.find_element(By.XPATH, "//button[contains(text(),'Создать')]")
        #create_button.click()
        #time.sleep(2)

        #click_button(driver, "//button[contains(text(),'Создать')]")

        #
        # # 5️⃣ Вводим заголовок страницы
        # title_input = driver.find_element(By.XPATH, "//input[@placeholder='Введите заголовок']")
        # title_input.send_keys("Новая страница из MD")
        # time.sleep(1)
        #
        # # 6️⃣ Вставляем содержимое MD-файла в редактор
        # content_input = driver.find_element(By.XPATH, "//div[contains(@class, 'editor-content')]")
        # content_input.click()
        # content_input.send_keys(md_content)
        # time.sleep(2)
        #
        # # 7️⃣ Сохраняем страницу
        # save_button = driver.find_element(By.XPATH, "//button[contains(text(),'Сохранить')]")
        # save_button.click()
        #
        # print("✅ Страница успешно создана!")


    except Exception as e:
        print(f"❌ Ошибка: {e}")

    finally:
        # Закрываем браузер
        time.sleep(60)
        driver.quit()