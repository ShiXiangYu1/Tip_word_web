// 调试工具
console.log('Debug 模块已加载');

// 用于调试的全局对象
window.debugTools = {
    // 检查对象是否存在并有效
    checkObject: function(obj, name) {
        if (!obj) {
            console.error(`检查失败: ${name} 不存在`);
            return false;
        }
        console.log(`检查通过: ${name} 存在`, obj);
        console.log(`${name} 类型:`, typeof obj);
        console.log(`${name} 属性:`, Object.keys(obj));
        return true;
    },

    // 检查函数是否存在并可调用
    checkFunction: function(obj, funcName, objName = 'object') {
        if (!obj) {
            console.error(`检查失败: ${objName} 不存在`);
            return false;
        }
        
        try {
            if (typeof obj[funcName] !== 'function') {
                console.error(`检查失败: ${objName}.${funcName} 不是有效函数，它的类型是: ${typeof obj[funcName]}`);
                return false;
            }
            
            console.log(`检查通过: ${objName}.${funcName} 是有效函数`);
            return true;
        } catch (error) {
            console.error(`检查 ${objName}.${funcName} 时出错:`, error);
            return false;
        }
    },

    // 检查收藏管理器
    checkFavoritesManager: function() {
        console.log('开始检查收藏管理器...');
        const exists = this.checkObject(window.favoritesManager, 'favoritesManager');
        if (!exists) return false;
        
        console.log('检查原型链...');
        let proto = Object.getPrototypeOf(window.favoritesManager);
        let protoMethods = [];
        while (proto && proto !== Object.prototype) {
            const methods = Object.getOwnPropertyNames(proto)
                .filter(name => typeof proto[name] === 'function');
            protoMethods = protoMethods.concat(methods);
            proto = Object.getPrototypeOf(proto);
        }
        console.log('原型链上的方法:', protoMethods);
        
        const funcs = ['isInFavorites', 'isFavorite', 'toggleFavorite', 'addToFavorites', 'removeFromFavorites'];
        let allValid = true;
        
        funcs.forEach(func => {
            if (!this.checkFunction(window.favoritesManager, func, 'favoritesManager')) {
                allValid = false;
            }
        });
        
        console.log('检查全局辅助函数...');
        ['isFavorite', 'toggleFavorite'].forEach(func => {
            if (typeof window[func] === 'function') {
                console.log(`全局函数 ${func} 存在`);
            } else {
                console.error(`全局函数 ${func} 不存在`);
                allValid = false;
            }
        });
        
        console.log('收藏管理器检查' + (allValid ? '通过' : '失败'));
        
        // 尝试修复
        if (!allValid) {
            console.log('正在尝试修复收藏管理器...');
            this.attemptToFixFavoritesManager();
        }
        
        return allValid;
    },
    
    // 尝试修复收藏管理器
    attemptToFixFavoritesManager: function() {
        try {
            console.log('正在尝试重新构建收藏管理器函数...');
            
            // 如果isInFavorites存在但isFavorite不存在
            if (window.favoritesManager && 
                typeof window.favoritesManager.isInFavorites === 'function' && 
                typeof window.favoritesManager.isFavorite !== 'function') {
                
                console.log('正在添加isFavorite别名...');
                window.favoritesManager.isFavorite = function(promptId) {
                    return this.isInFavorites(promptId);
                };
                
                // 绑定this上下文
                window.favoritesManager.isFavorite = 
                    window.favoritesManager.isFavorite.bind(window.favoritesManager);
                
                console.log('isFavorite别名已添加');
            }
            
            // 添加或修复全局函数
            if (window.favoritesManager) {
                console.log('正在修复全局辅助函数...');
                
                window.isFavorite = function(promptId) {
                    if (typeof window.favoritesManager.isFavorite === 'function') {
                        return window.favoritesManager.isFavorite(promptId);
                    } else if (typeof window.favoritesManager.isInFavorites === 'function') {
                        return window.favoritesManager.isInFavorites(promptId);
                    }
                    return false;
                };
                
                window.toggleFavorite = function(prompt) {
                    if (typeof window.favoritesManager.toggleFavorite === 'function') {
                        return window.favoritesManager.toggleFavorite(prompt);
                    }
                    return false;
                };
                
                console.log('全局辅助函数已修复');
            }
            
            console.log('修复尝试完成，重新检查...');
            return this.checkFavoritesManager();
        } catch (error) {
            console.error('尝试修复收藏管理器时出错:', error);
            return false;
        }
    },
    
    // 初始化调试
    init: function() {
        console.log('初始化调试工具...');
        
        // DOM加载完成后进行检查
        document.addEventListener('DOMContentLoaded', () => {
            window.setTimeout(() => {
                this.checkFavoritesManager();
            }, 1000);
        });
    },

    // 工具函数：一键刷新所有缓存
    clearAllCache: function() {
        console.log('正在清除所有缓存...');
        
        try {
            // 清除localStorage缓存
            const preserveItems = ['favorites'];  // 保留的项目
            const itemsToRemove = [];
            
            // 收集要删除的项目
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (!preserveItems.includes(key)) {
                    itemsToRemove.push(key);
                }
            }
            
            // 删除收集到的项目
            itemsToRemove.forEach(key => {
                localStorage.removeItem(key);
                console.log(`已删除localStorage项: ${key}`);
            });
            
            // 添加刷新全部功能到控制台
            console.log('添加全局刷新函数: window.refreshAll()');
            window.refreshAll = function() {
                console.log('正在强制刷新页面并清除缓存...');
                window.location.reload(true);
            };
            
            console.log('缓存清理完成，您可以在控制台执行 window.refreshAll() 来强制刷新页面');
            return true;
        } catch (error) {
            console.error('清除缓存时出错:', error);
            return false;
        }
    }
};

// 初始化调试工具
window.debugTools.init(); 