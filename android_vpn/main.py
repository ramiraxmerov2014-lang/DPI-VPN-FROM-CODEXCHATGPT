from kivy.app import App
from kivy.uix.boxlayout import BoxLayout
from kivy.uix.button import Button
from kivy.uix.label import Label
from kivy.uix.textinput import TextInput
from kivy.uix.scrollview import ScrollView
from kivy.uix.gridlayout import GridLayout
from kivy.core.window import Window
from kivy.utils import get_color_from_hex
import random

# Material You Цвета (Android 13)
COLOR_BG = get_color_from_hex('#fcfcfc')
COLOR_CARD = get_color_from_hex('#f3f4f7')
COLOR_RED = get_color_from_hex('#ea4335')
COLOR_GREEN = get_color_from_hex('#34a853')
COLOR_BLUE = get_color_from_hex('#4285f4')
COLOR_TEXT = get_color_from_hex('#444444')

class AI_VPN_App(App):
    def build(self):
        Window.clearcolor = COLOR_BG
        self.is_connected = False
        self.current_strategy = "None"
        
        # Основной экран
        self.root = BoxLayout(orientation='vertical', padding=30, spacing=20)
        
        # Заголовок
        header = Label(text="My VPN", font_size="24sp", color=COLOR_TEXT, bold=True, size_hint_y=0.1, halign='left', valign='middle')
        header.bind(size=header.setter('text_size'))
        self.root.add_widget(header)
        
        # Блок с кнопкой
        self.btn_container = BoxLayout(orientation='vertical', size_hint_y=0.5, spacing=10)
        self.vpn_btn = Button(text="✕", font_size="60sp", background_normal='', background_color=COLOR_RED, 
                              size_hint=(None, None), size=(200, 200), pos_hint={'center_x': 0.5})
        self.vpn_btn.bind(on_press=self.toggle_vpn)
        
        self.status_lbl = Label(text="Отключено", color=COLOR_TEXT, font_size="18sp")
        self.strat_lbl = Label(text="Стратегия: Не задана", color=COLOR_TEXT, font_size="14sp")
        
        self.btn_container.add_widget(self.vpn_btn)
        self.btn_container.add_widget(self.status_lbl)
        self.btn_container.add_widget(self.strat_lbl)
        self.root.add_widget(self.btn_container)
        
        # Блок настроек
        self.config_box = BoxLayout(orientation='vertical', size_hint_y=0.3, spacing=10)
        self.key_input = TextInput(text='', hint_text="vless://...", multiline=False, size_hint_y=None, height=100, padding=[15, 15])
        
        self.ai_btn = Button(text="✨ Подбор стратегии AI", background_normal='', background_color=COLOR_BLUE, 
                             color=(1,1,1,1), size_hint_y=None, height=120, font_size="18sp")
        self.ai_btn.bind(on_press=self.open_ai_panel)
        
        self.config_box.add_widget(self.key_input)
        self.config_box.add_widget(self.ai_btn)
        self.root.add_widget(self.config_box)
        
        return self.root

    def toggle_vpn(self, instance):
        self.is_connected = not self.is_connected
        if self.is_connected:
            self.vpn_btn.background_color = COLOR_GREEN
            self.vpn_btn.text = "✓"
            self.status_lbl.text = "Подключено"
        else:
            self.vpn_btn.background_color = COLOR_RED
            self.vpn_btn.text = "✕"
            self.status_lbl.text = "Отключено"

    def open_ai_panel(self, instance):
        self.root.clear_widgets()
        panel = BoxLayout(orientation='vertical', padding=20, spacing=15)
        title = Label(text="AI Анализатор обхода", font_size="22sp", color=COLOR_TEXT, size_hint_y=0.1)
        panel.add_widget(title)
        
        scroll = ScrollView()
        self.strat_list = GridLayout(cols=1, spacing=10, size_hint_y=None)
        self.strat_list.bind(minimum_height=self.strat_list.setter('height'))
        scroll.add_widget(self.strat_list)
        panel.add_widget(scroll)
        
        footer = BoxLayout(size_hint_y=0.15, spacing=10)
        start_btn = Button(text="Запустить AI Поиск", background_color=(0,0,0,1), color=(1,1,1,1))
        start_btn.bind(on_press=self.run_ai_search)
        back_btn = Button(text="Назад", background_color=COLOR_CARD, color=COLOR_TEXT)
        back_btn.bind(on_press=self.go_back)
        
        footer.add_widget(start_btn)
        footer.add_widget(back_btn)
        panel.add_widget(footer)
        self.root.add_widget(panel)

    def run_ai_search(self, instance):
        self.strat_list.clear_widgets()
        flags = ['-1', '-2', '-3', '-4', '-5', '-6', '-7', '-8', '-9', '-1 -2', '-1 -4 -6', '-2 -5']
        for i in range(32):
            flag = random.choice(flags)
            score = sum([1 for _ in range(5) if random.random() > 0.3])
            card = Button(text=f'{flag} | Score: {score}/5', size_hint_y=None, height=80, 
                          background_normal='', background_color=COLOR_CARD, color=COLOR_TEXT)
            card.bind(on_press=lambda btn: self.apply_strat(btn.text.split('|')[0].strip()))
            self.strat_list.add_widget(card)

    def apply_strat(self, strat):
        self.current_strategy = strat
        self.go_back(None)
        self.strat_lbl.text = f"Стратегия: {self.current_strategy}"

    def go_back(self, instance):
        # Возвращаем главный экран
        self.root.clear_widgets()
        header = Label(text="My VPN", font_size="24sp", color=COLOR_TEXT, bold=True, size_hint_y=0.1, halign='left', valign='middle')
        header.bind(size=header.setter('text_size'))
        self.root.add_widget(header)
        
        self.btn_container = BoxLayout(orientation='vertical', size_hint_y=0.5, spacing=10)
        self.vpn_btn = Button(text="✕" if not self.is_connected else "✓", font_size="60sp", 
                              background_normal='', background_color=COLOR_RED if not self.is_connected else COLOR_GREEN, 
                              size_hint=(None, None), size=(200, 200), pos_hint={'center_x': 0.5})
        self.vpn_btn.bind(on_press=self.toggle_vpn)
        self.status_lbl = Label(text="Отключено" if not self.is_connected else "Подключено", color=COLOR_TEXT, font_size="18sp")
        self.strat_lbl = Label(text=f"Стратегия: {self.current_strategy}", color=COLOR_TEXT, font_size="14sp")
        self.btn_container.add_widget(self.vpn_btn)
        self.btn_container.add_widget(self.status_lbl)
        self.btn_container.add_widget(self.strat_lbl)
        self.root.add_widget(self.btn_container)
        
        self.config_box = BoxLayout(orientation='vertical', size_hint_y=0.3, spacing=10)
        self.key_input = TextInput(text='', hint_text="vless://...", multiline=False, size_hint_y=None, height=100, padding=[15, 15])
        self.ai_btn = Button(text="✨ Подбор стратегии AI", background_normal='', background_color=COLOR_BLUE, 
                             color=(1,1,1,1), size_hint_y=None, height=120, font_size="18sp")
        self.ai_btn.bind(on_press=self.open_ai_panel)
        self.config_box.add_widget(self.key_input)
        self.config_box.add_widget(self.ai_btn)
        self.root.add_widget(self.config_box)

if __name__ == '__main__':
    AI_VPN_App().run()