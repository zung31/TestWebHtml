let db;

function initDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open('TestWebHtmlDB', 1);
        request.onupgradeneeded = function(event) {
            db = event.target.result;
            // create categories table
            if (!db.objectStoreNames.contains('categories')) {
                const categoriesStore = db.createObjectStore('categories', { keyPath: 'id', autoIncrement: true });
                categoriesStore.createIndex('intitule', 'intitule', { unique: false });
                categoriesStore.createIndex('parent_id', 'parent_id', { unique: false });
                categoriesStore.createIndex('order', 'order', { unique: false });
                categoriesStore.createIndex('created', 'created', { unique: false });
                categoriesStore.createIndex('modified', 'modified', { unique: false });
            }
            // create produits table
            if (!db.objectStoreNames.contains('produits')) {
                const produitsStore = db.createObjectStore('produits', { keyPath: 'id', autoIncrement: true });
                produitsStore.createIndex('intitule', 'intitule', { unique: false });
                produitsStore.createIndex('descriptif', 'descriptif', { unique: false });
                produitsStore.createIndex('category_id', 'category_id', { unique: false });
                produitsStore.createIndex('created', 'created', { unique: false });
                produitsStore.createIndex('modified', 'modified', { unique: false });
            }
        };
        request.onsuccess = function(event) {
            db = event.target.result;
            console.log('IndexedDB initialized');
            resolve();
        };

        request.onerror = function(event) {
            console.error('Erreur lors de l\'initialisation de IndexedDB:', event.target.errorCode);
            reject(event.target.errorCode);
        };
    });
}
// categories gestion
function addCategoryDb(category, callback) {
    const transaction = db.transaction(['categories'], 'readwrite');
    const store = transaction.objectStore('categories');
    const request = store.add(category);
    request.onsuccess = function(event) {
        console.log('Category added:', event.target.result);
        callback({ success: true, categoryId: event.target.result });
    };
    request.onerror = function(event) {
        console.error('Erreur lors de l\'ajout de la catégorie:', event.target.errorCode);
        callback({ success: false, message: 'Erreur lors de l\'ajout de la catégorie: ' + event.target.errorCode });
    };
}
function updateCategory(category) {
    const transaction = db.transaction(['categories'], 'readwrite');
    const store = transaction.objectStore('categories');
    const request = store.put(category);
    request.onsuccess = function() {
        console.log('Category updated:', request.result);
    };
    request.onerror = function(event) {
        console.error('Erreur lors de la mise à jour de la catégorie:', event.target.errorCode);
    };
}
function getCategories(callback) {
    const transaction = db.transaction(['categories'], 'readonly');
    const store = transaction.objectStore('categories');
    const categories = [];
    store.openCursor().onsuccess = function(event) {
        const cursor = event.target.result;
        if (cursor) {
            categories.push(cursor.value);
            cursor.continue();
        } else {
            callback({ success: true, categories: categories });
        }
    };
    transaction.onerror = function(event) {
        console.error('Erreur lors de la récupération des catégories:', event.target.errorCode);
        callback({ success: false, message: 'Erreur lors de la récupération des catégories: ' + event.target.errorCode });
    };
}
function updateCategoryOrderDb(categoryIds, parentId, callback) {
    const resolvedParentId = parentId === 'root' ? null : Number(parentId);
    const transaction = db.transaction(['categories'], 'readwrite');
    const store = transaction.objectStore('categories');
    let updatePromises = categoryIds.map((categoryId, index) => {
        return new Promise((resolve, reject) => {
            const request = store.get(Number(categoryId));
            request.onsuccess = (e) => {
                const category = e.target.result;
                if (!category) {
                    reject(`Category ${categoryId} not found`);
                    return;
                }
                const updatedCategory = {
                    ...category,
                    order: index + 1,
                    parent_id: resolvedParentId,
                    modified: new Date().toISOString()
                };
                const updateRequest = store.put(updatedCategory);
                updateRequest.onsuccess = () => resolve();
                updateRequest.onerror = (e) => reject(e.target.error);
            };
            request.onerror = (e) => reject(e.target.error);
        });
    });
    Promise.all(updatePromises)
        .then(() => {
            callback({ success: true });
            transaction.commit(); 
        })
        .catch((error) => {
            console.error('Update failed:', error);
            callback({ success: false, message: error });
            transaction.abort();
        });
}
function deleteCategoryDb(categoryId, callback) {
    const transaction = db.transaction(['categories'], 'readwrite');
    const categoriesStore = transaction.objectStore('categories');
    const deleteCategoryTree = async (targetCategoryId) => {
        const deleteSubCategories = () => {
            return new Promise((resolve, reject) => {
                const categoriesCursor = categoriesStore
                    .index('parent_id')
                    .openCursor(IDBKeyRange.only(targetCategoryId));
                categoriesCursor.onsuccess = (e) => {
                    const cursor = e.target.result;
                    if (cursor) {
                        const subCategoryId = cursor.value.id;
                        // Đệ quy xóa sous-category
                        deleteCategoryTree(subCategoryId)
                            .then(() => cursor.delete())
                            .then(() => cursor.continue())
                            .catch(reject);
                    } else {
                        resolve();
                    }
                };
                categoriesCursor.onerror = (e) => reject(e.target.error);
            });
        };
        // Thực hiện tuần tự: Xóa sous-category -> Xóa category hiện tại
        await deleteSubCategories();
        await categoriesStore.delete(targetCategoryId);
    };
    // Thực hiện xóa và xử lý kết quả
    deleteCategoryTree(categoryId)
        .then(() => {
            transaction.oncomplete = () => {
                const checkTransaction = db.transaction(['categories', 'produits'], 'readonly');
                const checkCategoriesStore = checkTransaction.objectStore('categories');
                const checkProductsStore = checkTransaction.objectStore('produits');
                new Promise((resolve, reject) => {
                    const productsToDelete = [];
                    const productCursorRequest = checkProductsStore.openCursor();
                    productCursorRequest.onsuccess = async (e) => {
                        const cursor = e.target.result;
                        if (!cursor) {
                            resolve(productsToDelete);
                            return;
                        }
                        const product = cursor.value;
                        try {
                            const categoryExists = await new Promise((resolve) => {
                                const request = checkCategoriesStore.get(Number(product.category_id));
                                request.onsuccess = (e) => resolve(!!e.target.result);
                                request.onerror = () => resolve(false);
                            });
                            if (!categoryExists) {
                                productsToDelete.push(product.id);
                            }
                            cursor.continue(); 
                        } catch (error) {
                            reject(error);
                        }
                    };
                    productCursorRequest.onerror = (e) => reject(e.target.error);
                })
                .then((productsToDelete) => {
                    if (productsToDelete.length === 0) {
                        callback({ success: true });
                        return;
                    }

                    const deleteTransaction = db.transaction(['produits'], 'readwrite');
                    const deleteStore = deleteTransaction.objectStore('produits');
                    deleteTransaction.oncomplete = () => callback({ success: true });
                    deleteTransaction.onerror = (e) => callback({ success: false, message: e.target.error });
                    productsToDelete.forEach(id => deleteStore.delete(id));
                })
                .catch((error) => callback({ success: false, message: error }));
            };
        })
        .catch((error) => {
            transaction.abort();
            callback({ success: false, message: error });
            console.error('Lỗi xóa:', error);
        });
}
// produits gestion
function addProductDb(product, callback) {
    const transaction = db.transaction(['produits'], 'readwrite');
    const store = transaction.objectStore('produits');
    const request = store.add(product);

    request.onsuccess = function(event) {
        console.log('Product added:', event.target.result);
        callback({ success: true, productId: event.target.result });
    };
    request.onerror = function(event) {
        console.error('Erreur lors de l\'ajout du produit:', event.target.errorCode);
        callback({ success: false, message: 'Erreur lors de l\'ajout du produit: ' + event.target.errorCode });
    };
}
function deleteProductDb(id, callback) {
    const transaction = db.transaction(['produits'], 'readwrite');
    const store = transaction.objectStore('produits');
    const request = store.delete(Number(id));

    transaction.oncomplete = function() {
        console.log('Transaction completed: Product deleted');
        callback({ success: true });
    };
    transaction.onerror = function(event) {
        console.error('Transaction error:', event.target.error);
        callback({ success: false, message: event.target.error });
    };
    request.onsuccess = function() {
        console.log('Delete request processed');
    };
    request.onerror = function(event) {
        console.error('Delete request failed:', event.target.error);
        callback({ success: false, message: event.target.error });
    };
}
function updateProduct(product, callback) {
    const transaction = db.transaction(['produits'], 'readwrite');
    const store = transaction.objectStore('produits');
    const request = store.put(product);

    request.onsuccess = function() {
        console.log('Product updated:', request.result);
        callback({ success: true });
    };

    request.onerror = function(event) {
        console.error('Erreur lors de la mise à jour du produit:', event.target.errorCode);
        callback({ success: false, message: 'Erreur lors de la mise à jour du produit: ' + event.target.errorCode });
    };
}
function getProducts(categoryId, callback) {
    const transaction = db.transaction(['produits'], 'readonly');
    const store = transaction.objectStore('produits');
    const products = [];

    const index = store.index('category_id');
    const request = index.openCursor(IDBKeyRange.only(categoryId));

    request.onsuccess = function(event) {
        const cursor = event.target.result;
        if (cursor) {
            products.push(cursor.value);
            cursor.continue();
        } else {
            callback({ success: true, products: products });
        }
    };

    request.onerror = function(event) {
        console.error('Erreur lors de la récupération des produits:', event.target.errorCode);
        callback({ success: false, message: 'Erreur lors de la récupération des produits: ' + event.target.errorCode });
    };
}

// search product and category
function searchCategoriesAndProducts(searchTerm, callback) {
    const transaction = db.transaction(['categories', 'produits'], 'readonly');
    const categoriesStore = transaction.objectStore('categories');
    const produitsStore = transaction.objectStore('produits');

    const categories = [];
    const products = [];

    // Tìm kiếm danh mục
    categoriesStore.openCursor().onsuccess = function(event) {
        const cursor = event.target.result;
        if (cursor) {
            const category = cursor.value;
            if (category.intitule.toLowerCase().includes(searchTerm.toLowerCase())) {
                categories.push(category);
            }
            cursor.continue();
        }
    };

    // Tìm kiếm sản phẩm
    produitsStore.openCursor().onsuccess = function(event) {
        const cursor = event.target.result;
        if (cursor) {
            const product = cursor.value;
            if (product.intitule.toLowerCase().includes(searchTerm.toLowerCase())) {
                products.push(product);
            }
            cursor.continue();
        }
    };
    transaction.oncomplete = function() {
        callback({ success: true, categories: categories, products: products });
    };
    transaction.onerror = function(event) {
        console.error('Erreur lors de la recherche:', event.target.errorCode);
        callback({ success: false, message: 'Erreur lors de la recherche: ' + event.target.errorCode });
    };
}

initDB();