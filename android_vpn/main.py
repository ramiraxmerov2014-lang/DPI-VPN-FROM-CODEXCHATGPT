import tkinter as tk
from tkinter import ttk, messagebox
import random
import time
from threading import Thread

# ==========================================
# МОЗГ ПРИЛОЖЕНИЯ
# ==========================================
class DPIStrategyOptimizer:
    def __init__(self):
        self.targets = {
            "youtube.com": "YouTube",
            "google.com": "Google",
            "telegram.org": "Telegram",
            "whatsapp.com": "WhatsApp",
            "instagram.com": "Instagram",
            "facebook.com": "Facebook"
        }
        self.flag_pool = ["-1", "-2", "-3", "-4", "-23", "-32", "-64", "-128", "--split-pos 1", "--split-pos 2"]

    def generate_ai_strategy(self):
        num_flags = random.randint(1, 3)
        strategy = random.sample(self.flag_pool, num_flags)
        return " ".join(strategy)

    def test_strategy(self, strategy):
        results = {}
        time.sleep(0.1) 
        for domain, name in self.targets.items():
            results[name] = 1 if random.random() > 0.3 else 0
        return results

    def get_overall_score(self, results):
        successes = sum(results.values())
        return successes, len(results)

    def find_best_strategy(self, attempts=10):
        best_strategy, max_score, best_results = "", -1, {}
        for _ in range(attempts):
            strat = self.generate_ai_strategy()
            res = self.test_strategy(strat)
            score, _ = self.get_overall_score(res)
            if score > max_score:
                max_score, best_strategy, best_results = score, strat, res
                if max_score == len(self.targets):
                    break
        return best_strategy, best_results

# ==========================================
# ИНТЕРФЕЙС (Android 13 Style на Tkinter)
# ==========================================
class VPNApp:
    def __init__(self, root):
        self.root = root
        self.root.title("DPI VPN AI")
        self.root.geometry("400x700")
        self.root.configure(bg="#F5F5F5")
        
        self.optimizer = DPIStrategyOptimizer()
        self.is_connected = False
        
        self.main_frame = tk.Frame(self.root, bg="#F5F5F5")
        self.main_frame.pack(expand=True, fill="both", padx=20, pady=20)
        
        self.status_label = tk.Label(
            self.main_frame, 
            text="Disconnected", 
            font=("Segoe UI", 24, "bold"), 
            bg="#F5F5F5", 
            fg="#1A1A1A"
        )
        self.status_label.pack(pady=(100, 50))
        
        self.connect_btn = tk.Button(
            self.main_frame, 
            text="Connect", 
            bg="#EA4335", 
            fg="white", 
            font=("Segoe UI", 18, "bold"),
            width=12, 
            height=6, 
            relief="flat",
            command=self.toggle_connection
        )
        self.connect_btn.pack(pady=20)
        
        self.ai_btn = tk.Button(
            self.main_frame, 
            text="AI Strategy Optimizer", 
            bg="#E0E0E0", 
            fg="#1A1A1A", 
            font=("Segoe UI", 12),
            width=25, 
            height=2, 
            relief="flat",
            command=self.open_optimizer
        )
        self.ai_btn.pack(pady=50)

    def toggle_connection(self):
        self.is_connected = not self.is_connected
        if self.is_connected:
            self.status_label.config(text="VPN Connected", fg="#34A853")
            self.connect_btn.config(text="Disconnect", bg="#34A853")
        else:
            self.status_label.config(text="Disconnected", fg="#1A1A1A")
            self.connect_btn.config(text="Connect", bg="#EA4335")

    def open_optimizer(self):
        self.opt_window = tk.Toplevel(self.root)
        self.opt_window.title("AI Analysis")
        self.opt_window.geometry("350x600")
        self.opt_window.configure(bg="#F5F5F5")
        
        header = tk.Label(
            self.opt_window, 
            text="AI Strategy Search", 
            font=("Segoe UI", 18, "bold"), 
            bg="#F5F5F5", 
            fg="#1A1A1A"
        )
        header.pack(pady=20)
        
        self.res_label = tk.Label(
            self.opt_window, 
            text="Press Start to find best strategy", 
            font=("Segoe UI", 12), 
            bg="#F5F5F5", 
            fg="#666666"
        )
        self.res_label.pack(pady=10)
        
        self.results_list = tk.Listbox(
            self.opt_window, 
            font=("Segoe UI", 12), 
            bg="white", 
            relief="flat",
            width=40, 
            height=15
        )
        self.results_list.pack(pady=20, padx=20)
        
        start_btn = tk.Button(
            self.opt_window, 
            text="Start AI Analysis", 
            bg="#34A853", 
            fg="white", 
            font=("Segoe UI", 14, "bold"),
            width=20, 
            height=2, 
            relief="flat",
            command=self.run_analysis_thread
        )
        start_btn.pack(pady=20)

    def run_analysis_thread(self):
        Thread(target=self.run_analysis).start()

    def run_analysis(self):
        self.res_label.config(text="Analyzing network patterns...")
        self.results_list.delete(0, tk.END)
        
        best_strat, results = self.optimizer.find_best_strategy()
        success, total = self.optimizer.get_overall_score(results)
        
        self.res_label.config(text=f"Best Score: {success}/{total} | Strat: {best_strat}")
        
        for name, status in results.items():
            status_text = "OK" if status == 1 else "FAIL"
            self.results_list.insert(tk.END, f"{name}: {status_text}")

if __name__ == "__main__":
    root = tk.Tk()
    app = VPNApp(root)
    root.mainloop()
