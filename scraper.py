from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import TimeoutException
import json
import os
import time
import re

def clean_text(text):
    # 清理文本中的特殊字符和多余空白
    text = re.sub(r'\s+', ' ', text)
    return text.strip()

def scrape_prompts():
    # 目标网站URL
    url = 'https://anaitsc.xiaofeipandian.cn/categories.html'
    
    try:
        print('正在启动浏览器...')
        options = webdriver.ChromeOptions()
        options.add_argument('--headless')  # 无头模式
        options.add_argument('--disable-gpu')
        options.add_argument('--no-sandbox')
        options.add_argument('--disable-dev-shm-usage')
        
        driver = webdriver.Chrome(options=options)
        wait = WebDriverWait(driver, 10)  # 最多等待10秒
        
        print(f'正在访问页面: {url}')
        driver.get(url)
        
        # 等待内容加载
        print('等待页面加载...')
        try:
            wait.until(EC.presence_of_element_located((By.CLASS_NAME, 'prompt-card')))
        except TimeoutException:
            print('页面加载超时')
            driver.quit()
            return False
        
        # 给JavaScript一些时间来完全渲染页面
        time.sleep(3)
        
        print('正在提取提示词数据...')
        prompts = []
        prompt_id = 1
        seen_contents = set()  # 用于去重
        
        # 获取所有提示词卡片
        cards = driver.find_elements(By.CLASS_NAME, 'prompt-card')
        
        for card in cards:
            try:
                title = clean_text(card.find_element(By.CLASS_NAME, 'prompt-title').text)
                content = clean_text(card.find_element(By.CLASS_NAME, 'prompt-content').text)
                category = clean_text(card.find_element(By.CLASS_NAME, 'prompt-category').text)
                
                # 使用内容作为唯一标识进行去重
                if content and content not in seen_contents:
                    seen_contents.add(content)
                    prompt = {
                        'id': str(prompt_id),
                        'title': title or '未命名提示词',
                        'content': content,
                        'category': category or '未分类'
                    }
                    prompts.append(prompt)
                    prompt_id += 1
                    print(f'已添加提示词: {prompt["title"]}')
            except Exception as e:
                print(f'提取卡片数据时出错: {str(e)}')
                continue
        
        driver.quit()
        
        if not prompts:
            print('未找到任何提示词数据')
            return False
        
        # 确保data目录存在
        if not os.path.exists('data'):
            os.makedirs('data')
        
        # 保存为JSON文件
        with open('data/prompts.json', 'w', encoding='utf-8') as f:
            json.dump({'prompts': prompts}, f, ensure_ascii=False, indent=2)
            
        print(f'\n成功抓取 {len(prompts)} 条提示词数据')
        return True
        
    except Exception as e:
        print(f'抓取失败: {str(e)}')
        import traceback
        print('详细错误信息:')
        print(traceback.format_exc())
        if 'driver' in locals():
            driver.quit()
        return False

if __name__ == '__main__':
    scrape_prompts() 