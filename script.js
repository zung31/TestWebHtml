document.addEventListener('DOMContentLoaded', function () {
    let copiedCategory = null;
    let copiedProduct = null;
    let currentTargetCategoryId = null;

    const addButton = document.getElementById('add-category-btn');
    const intituleInput = document.getElementById('intitule');

    // handle search bar
    const searchBar = document.querySelector('.search-bar input');
    searchBar.addEventListener('input', function () {
        const searchTerm = searchBar.value.toLowerCase();
        searchCategoriesAndProducts(searchTerm);
    });
    function searchCategoriesAndProducts(searchTerm) {
        fetch('search.php?q=' + encodeURIComponent(searchTerm))
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    const categories = document.querySelectorAll('.category-card');
                    const products = document.querySelectorAll('.product-card');

                    // Reset display for all categories and products
                    categories.forEach(category => category.style.display = 'block');
                    products.forEach(product => product.style.display = 'block');

                    // Hide categories and products that do not match the search term
                    categories.forEach(category => {
                        const categoryName = category.querySelector('span').textContent.toLowerCase();
                        const productsContainer = category.querySelector('.products-container');
                        let categoryMatches = categoryName.includes(searchTerm);
                        let productMatches = false;

                        if (productsContainer) {
                            const productCards = productsContainer.querySelectorAll('.product-card');
                            productCards.forEach(productCard => {
                                const productName = productCard.querySelector('span').textContent.toLowerCase();
                                if (productName.includes(searchTerm)) {
                                    productMatches = true;
                                    productCard.style.display = 'block';
                                } else {
                                    productCard.style.display = 'none';
                                }
                            });
                        }
                        if (categoryMatches || productMatches) {
                            category.style.display = 'block';
                            if (productMatches) {
                                productsContainer.style.display = 'block';
                            }
                        } else {
                            category.style.display = 'none';
                        }
                    });

                    // Ensure parent categories are shown if a sub-category or product matches
                    data.categories.forEach(category => {
                        let parentId = category.parent_id;
                        while (parentId) {
                            const parentCategory = document.querySelector(`.category-card[data-id="${parentId}"]`);
                            if (parentCategory) {
                                parentCategory.style.display = 'block';
                                parentId = parentCategory.getAttribute('data-parent-id');
                            } else {
                                break;
                            }
                        }
                    });

                    data.products.forEach(product => {
                        const categoryCard = document.querySelector(`.category-card[data-id="${product.category_id}"]`);
                        if (categoryCard) {
                            categoryCard.style.display = 'block';
                            const productsContainer = categoryCard.querySelector('.products-container');
                            if (productsContainer) {
                                productsContainer.style.display = 'block';
                            }
                        }
                    });
                } else {
                    console.error('Erreur lors de la recherche:', data.message);
                }
            })
            .catch(error => {
                console.error('Erreur:', error);
            });
    }

    // get data from database
    fetch('get-categories.php')
        .then(response => response.json())
        .then(data => {
            const container = document.getElementById('categories-container');
            if (data.success) {
                renderCategories(data.categories, container);
                initSortable(); // init drag and drop
            } else {
                container.innerHTML = '<p class="text-center">Aucune catégorie trouvée.</p>';
            }
        })
        .catch(error => {
            console.error('Erreur:', error);
        });

    // function to render categories and sous-categories
    function renderCategories(categories, container, parentId = null) {
        categories.filter(cat => cat.parent_id === parentId)
        .sort((a, b) => a.order - b.order)
        .forEach(category => {
            const categoryCard = document.createElement('div');
            categoryCard.className = 'category-card p-3';
            categoryCard.setAttribute('data-id', category.id);
            categoryCard.setAttribute('data-parent-id', category.parent_id || 'root'); // root là category niv 1
            categoryCard.innerHTML = `
                <div class="d-flex justify-content-between align-items-center">
                    <span>${category.intitule}</span>
                    <div>
                        <button class="btn btn-sm btn-success btn-add-sous-category" data-id="${category.id}" data-bs-toggle="tooltip" title="Add Sous-Category">
                            <i class="fas fa-plus"></i>
                        </button>
                        <button class="btn btn-sm btn-success btn-toggle-menu" data-id="${category.id}" data-bs-toggle="tooltip" title="Menu Sub Categories">
                            <i class="fas fa-bars"></i>
                        </button>
                        <button class="btn btn-sm btn-success btn-edit-category" data-id="${category.id}" data-bs-toggle="tooltip" title="Edit Category">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-sm btn-success btn-show-products" data-id="${category.id}" data-bs-toggle="tooltip" title="Show Products">
                            <i class="fas fa-box"></i>
                        </button>
                        <button class="btn btn-sm btn-success btn-copy-category" data-id="${category.id}" data-bs-toggle="tooltip" title="Copy Category">
                            <i class="fas fa-copy"></i>
                        </button>
                        <button class="btn btn-sm btn-danger btn-delete-category" data-id="${category.id}" data-bs-toggle="tooltip" title="Delete Category">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
                <div class="add-sous-category-input mt-2">
                    <input type="text" class="form-control form-control-sm" placeholder="Intitulé de la sous-catégorie">
                    <button class="btn btn-sm btn-success mt-2">Ajouter</button>
                </div>
                <div class="products-container mt-2" data-category-id="${category.id}"></div>
                <div class="sous-category mt-2" data-parent-id="${category.id}"></div>
            `;

            container.appendChild(categoryCard);

            // Hiển thị sous-categories
            const sousCategoryContainer = categoryCard.querySelector('.sous-category');
            renderCategories(categories, sousCategoryContainer, category.id);

            // Sự kiện cho button Add Sous-Category
            const addSousCategoryBtn = categoryCard.querySelector('.btn-add-sous-category');
            const addSousCategoryInput = categoryCard.querySelector('.add-sous-category-input');
            addSousCategoryBtn.addEventListener('click', function () {
                addSousCategoryInput.style.display = 'block';
            });

            // Sự kiện cho button Ajouter trong input field
            const addButton = categoryCard.querySelector('.add-sous-category-input button');
            const inputField = categoryCard.querySelector('.add-sous-category-input input');
            addButton.addEventListener('click', function () {
                const intitule = inputField.value.trim();
                if (intitule) {
                    addSousCategory(category.id, intitule, sousCategoryContainer);
                    inputField.value = '';
                    addSousCategoryInput.style.display = 'none';
                }
            });

            // Sự kiện cho button Menu
            const toggleMenuBtn = categoryCard.querySelector('.btn-toggle-menu');
            toggleMenuBtn.addEventListener('click', function () {
                sousCategoryContainer.style.display = sousCategoryContainer.style.display === 'none' ? 'block' : 'none';
            });

            // Sự kiện cho button Edit
            const editButton = categoryCard.querySelector('.btn-edit-category');
            editButton.addEventListener('click', function () {
                const editCategoryModal = new bootstrap.Modal(document.getElementById('editCategoryModal'));
                const editCategoryInput = document.getElementById('edit-category-input');
                editCategoryInput.value = category.intitule;
                editCategoryModal.show();

                const saveEditButton = document.getElementById('save-edit-category-btn');
                saveEditButton.onclick = function () {
                    const newIntitule = editCategoryInput.value.trim();
                    if (newIntitule !== '') {
                        updateCategoryName(category.id, newIntitule, categoryCard);
                        editCategoryModal.hide();
                    }
                };
            });
            function updateCategoryName(categoryId, newIntitule, categoryCard) {
                fetch('update-category-name.php', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ id: categoryId, intitule: newIntitule }),
                })
                .then(response => response.json())
                .then(data => {
                    if (data.success) {
                        const categoryNameSpan = categoryCard.querySelector('span');
                        categoryNameSpan.textContent = newIntitule;
                        alert('Catégorie mise à jour avec succès.');
                    } else {
                        alert('Erreur lors de la mise à jour de la catégorie.');
                    }
                })
                .catch(error => {
                    console.error('Erreur:', error);
                    alert('Une erreur s\'est produite lors de la mise à jour de la catégorie.');
                });
            }

            // Sự kiện cho button Copy
            const copyButton = categoryCard.querySelector('.btn-copy-category');
            copyButton.addEventListener('click', function () {
                copiedCategory = category;
                const copyCategoryModal = new bootstrap.Modal(document.getElementById('copyCategoryModal'));
                copyCategoryModal.show();
            });

            // Sự kiện cho button Delete
            const deleteButton = categoryCard.querySelector('.btn-delete-category');
            deleteButton.addEventListener('click', function () {
                categoryToDeleteId = category.id; // Lưu id của category cần xóa
                const modal = new bootstrap.Modal(document.getElementById('deleteConfirmationModal'));
                modal.show();
            });

            // Sự kiện cho button Show Products
            const showProductsButton = categoryCard.querySelector('.btn-show-products');
            showProductsButton.addEventListener('click', function () {
                const categoryId = this.getAttribute('data-id');
                const productsContainer = categoryCard.querySelector('.products-container');
                if (productsContainer.style.display !== 'none') {
                    productsContainer.style.display = 'none';
                } else {
                    fetchProducts(categoryId, productsContainer);
                    productsContainer.style.display = 'block';
                }
            });
            function fetchProducts(categoryId, container) {
                fetch('get-products.php?category_id=' + categoryId)
                    .then(response => {
                        if (!response.ok) {
                            throw new Error('Network response was not ok');
                        }
                        return response.text();
                    })
                    .then(text => {
                        try {
                            const data = JSON.parse(text);
                            if (data.success) {
                                renderProducts(data.products, container, categoryId);
                            } else {
                                container.innerHTML = '<p class="text-center">Aucun produit trouvé.</p>';
                            }
                        } catch (error) {
                            console.error('Failed to parse JSON:', error);
                            console.error('Raw response:', text);
                        }
                    })
                    .catch(error => {
                        console.error('Erreur:', error);
                    });
            }
            // function display products
            function renderProducts(products, container, categoryId) {
                container.innerHTML = '';
                const productsContainer = document.createElement('div');
                productsContainer.className = 'products-container ml-4'; // thụt vào so với category        
                products.forEach(product => {
                    const productCard = document.createElement('div');
                    productCard.className = 'product-card p-3 mb-3';
                    productCard.innerHTML = `
                        <div class="d-flex justify-content-between align-items-center">
                            <span>${product.intitule}</span>
                            <div>
                                <button class="btn btn-sm btn-success btn-edit-product" data-id="${product.id}" data-bs-toggle="tooltip" title="Edit Product">
                                    <i class="fas fa-edit"></i>
                                </button>
                                <button class="btn btn-sm btn-success btn-copy-product" data-id="${product.id}" data-bs-toggle="tooltip" title="Copy Product">
                                    <i class="fas fa-copy"></i>
                                </button>
                                <button class="btn btn-sm btn-danger btn-delete-product" data-id="${product.id}" data-bs-toggle="tooltip" title="Delete Product">
                                    <i class="fas fa-trash"></i>
                                </button>
                            </div>
                        </div>
                    `;
                    productsContainer.appendChild(productCard);
                    // button edit product
                    const editProductButton = productCard.querySelector('.btn-edit-product');
                    editProductButton.addEventListener('click', function () {
                        const editProductModal = new bootstrap.Modal(document.getElementById('editProductModal'));
                        const editProductIntitule = document.getElementById('editProductIntitule');
                        const editProductDescriptif = document.getElementById('editProductDescriptif');
                        editProductIntitule.value = product.intitule;
                        editProductDescriptif.value = product.descriptif;
                        document.getElementById('editProductId').value = product.id;
                        editProductModal.show();
                    });
                    // button copy product
                    const copyProductButton = productCard.querySelector('.btn-copy-product');
                    copyProductButton.addEventListener('click', function () {
                        copiedProduct = product;
                        const copyProductModal = new bootstrap.Modal(document.getElementById('copyProductModal'));
                        copyProductModal.show();
                    });
                    // button delete product
                    const deleteProductButton = productCard.querySelector('.btn-delete-product');
                    deleteProductButton.addEventListener('click', function () {
                        const deleteProductModal = new bootstrap.Modal(document.getElementById('deleteProductModal'));
                        document.getElementById('confirmDeleteProductBtn').setAttribute('data-id', product.id);
                        deleteProductModal.show();
                    });
                });
                // Thêm button "Add Product"
                const addProductButton = document.createElement('button');
                addProductButton.className = 'btn btn-sm btn-success mt-2';
                addProductButton.textContent = 'Add Product';
                productsContainer.appendChild(addProductButton);
                container.appendChild(productsContainer);
                addProductButton.addEventListener('click', function () {
                    const addProductModal = new bootstrap.Modal(document.getElementById('addProductModal'));
                    addProductModal.show();
                    document.getElementById('addProductModal').setAttribute('data-category-id', categoryId);
                }, { once: true });
            }
        });
    }

    // Sự kiện cho add product modal
    document.getElementById('saveProductBtn').addEventListener('click', function () {
        const categoryId = document.getElementById('addProductModal').getAttribute('data-category-id');
        const intitule = document.getElementById('productIntitule').value.trim();
        const descriptif = document.getElementById('productDescriptif').value.trim();

        if (intitule && descriptif) {
            addProduct(categoryId, intitule, descriptif);
        } else {
            alert('Veuillez remplir tous les champs.');
        }
    }, { once: true });
    // function add product
    function addProduct(categoryId, intitule, descriptif) {
        console.trace("saveProduct called");
        fetch('add-product.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ intitule, descriptif, category_id: categoryId }),
        })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    const newProduct = {
                        id: data.productId,
                        intitule: intitule,
                        descriptif: descriptif,
                        category_id: categoryId,
                    };

                    // Đóng modal
                    const addProductModal = bootstrap.Modal.getInstance(document.getElementById('addProductModal'));
                    addProductModal.hide();

                    // Làm mới danh sách sản phẩm
                    const productsContainer = document.querySelector(`[data-category-id="${categoryId}"] .products-container`);
                    if (productsContainer) {
                        location.reload();
                    }
                } else {
                    alert('Erreur lors de l\'ajout du produit.');
                }
            })
            .catch(error => {
                console.error('Erreur:', error);
            });
    }

    // edit product
    document.getElementById('saveEditProductBtn').addEventListener('click', function () {
        const productId = document.getElementById('editProductId').value;
        const intitule = document.getElementById('editProductIntitule').value.trim();
        const descriptif = document.getElementById('editProductDescriptif').value.trim();

        if (intitule && descriptif) {
            editProduct(productId, intitule, descriptif);
        } else {
            alert('Veuillez remplir tous les champs.');
        }
    });
    function editProduct(productId, intitule, descriptif) {
        fetch('edit-product.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ id: productId, intitule, descriptif }),
        })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    // Đóng modal
                    const editProductModal = bootstrap.Modal.getInstance(document.getElementById('editProductModal'));
                    editProductModal.hide();

                    // Làm mới danh sách sản phẩm
                    location.reload();
                } else {
                    alert('Erreur lors de la mise à jour du produit.');
                }
            })
            .catch(error => {
                console.error('Erreur:', error);
            });
    }

    // delete product
    document.getElementById('confirmDeleteProductBtn').addEventListener('click', function () {
        const productId = this.getAttribute('data-id');
        deleteProduct(productId);
    });
    function deleteProduct(productId) {
        fetch('delete-product.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ id: productId }),
        })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    // Đóng modal
                    const deleteProductModal = bootstrap.Modal.getInstance(document.getElementById('deleteProductModal'));
                    deleteProductModal.hide();

                    // Làm mới danh sách sản phẩm
                    location.reload();
                } else {
                    alert('Erreur lors de la suppression du produit.');
                }
            })
            .catch(error => {
                console.error('Erreur:', error);
            }
            );
    }

    // delete category
    document.getElementById('confirm-delete-btn').addEventListener('click', function () {
        if (categoryToDeleteId) {
            deleteCategory(categoryToDeleteId);
        }
    });
    function deleteCategory(categoryId) {
        fetch('delete-category.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ id: categoryId }),
        })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    location.reload(); // Tải lại trang để cập nhật danh sách
                } else {
                    alert('Erreur lors de la suppression de la catégorie.');
                }
            })
            .catch(error => {
                console.error('Erreur:', error);
            });
    }

    // function add sous-category
    function addSousCategory(parentId, intitule, container) {
        fetch('add-category.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ intitule, parent_id: parentId }),
        })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    const newCategory = {
                        id: data.categoryId,
                        intitule: intitule,
                        parent_id: parentId,
                    };
                    renderCategories([newCategory], container, parentId);
                    initSortable(); // re init drag and drop
                } else {
                    alert('Erreur lors de l\'ajout de la sous-catégorie.');
                }
            })
            .catch(error => {
                console.error('Erreur:', error);
            });
    }

    // init drag and drop
    function initSortable() {
        const containers = document.querySelectorAll('.sous-category, #categories-container');
        containers.forEach(container => {
            new Sortable(container, {
                group: {
                    name: 'shared',
                    pull: true,
                    put: function (to, from, dragEl) {
                        // Chỉ cho phép kéo thả giữa các category cùng parent_id
                        const toParentId = to.el.getAttribute('data-parent-id');
                        const fromParentId = from.el.getAttribute('data-parent-id');
                        return toParentId === fromParentId;
                    },
                },
                animation: 150,
                onEnd: function (evt) {
                    const container = evt.to;
                    const parentId = container.getAttribute('data-parent-id');
                    const categoryIds = Array.from(container.children).map(child => child.getAttribute('data-id'));
                    updateCategoryOrder(categoryIds, parentId);
                },
            });
        });
    }

    // update order after drag and drop
    function updateCategoryOrder(categoryIds, parentId) {
        fetch('update-category-order.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ categoryIds, parentId }),
        })
            .then(response => response.json())
            .then(data => {
                if (!data.success) {
                    alert('Erreur lors de la mise à jour de l\'ordre.');
                }
            })
            .catch(error => {
                console.error('Erreur:', error);
            });
    }

    // add category niv 1
    addButton.addEventListener('click', function () {
        const intitule = intituleInput.value.trim();

        if (intitule) {
            // Gửi yêu cầu AJAX đến back-end PHP
            fetch('add-category.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ intitule }),
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Erreur réseau');
                }
                return response.json();
            })
            .then(data => {
                if (data.success) {
                    alert(data.message); 
                    intituleInput.value = ''; 
                } else {
                    alert(data.message); 
                }
            })
            .catch(error => {
                console.error('Erreur:', error);
            });
        } else {
            alert('Veuillez entrer un intitulé valide.');
        }
    });

    // paste category and product
    function setupPasteHandler() {
        const categoriesContainer = document.getElementById('categories-container');
        categoriesContainer.addEventListener('mouseover', function (event) {
            const categoryCard = event.target.closest('.category-card');
            if (categoryCard) {
                currentTargetCategoryId = categoryCard.getAttribute('data-id');
            } else {
                currentTargetCategoryId = null;
            }
        });
        categoriesContainer.addEventListener('mouseleave', function () {
            currentTargetCategoryId = null;
        });
        currentTargetCategoryId = null;
    }
    document.addEventListener('keydown', function (event) {
        if (event.ctrlKey && event.key === 'v') { // check Ctrl + V
            if (copiedCategory) {
                if(!currentTargetCategoryId) { // paste in section category niv 1
                    pasteCategory(copiedCategory, null);
                }
                else{
                    pasteCategory(copiedCategory, currentTargetCategoryId);
                }
            }
            else if (copiedProduct) {
                if (currentTargetCategoryId) {
                    pasteProduct(copiedProduct, currentTargetCategoryId);
                } else {
                    alert('Please hover mouse on a category to paste the product.');
                }
            } 
        }
    });
    function pasteCategory(copiedCategory, targetCategoryId) {
        console.log(targetCategoryId);   
        const newCategory = {
            ...copiedCategory,
            parent_id: targetCategoryId
        };
        console.log(newCategory);
        fetch('add-category.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(newCategory),
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                alert('Category pasted successfully!');
                copiedCategory = null; // Reset copied category
                location.reload(); 
            } else {
                alert('Erreur lors de l\'ajout de la catégorie.');
            }
        })
        .catch(error => {
            console.error('Erreur:', error);
        });
    }
    function pasteProduct(copiedProduct, targetCategoryId) {
        const newProduct = {
            ...copiedProduct,
            category_id: targetCategoryId
        };
        fetch('add-product.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(newProduct),
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                alert('Product pasted successfully!');
                copiedProduct = null; 
                location.reload(); 
            } else {
                alert('Erreur lors de l\'ajout du produit.');
            }
        })
        .catch(error => {
            console.error('Erreur:', error);
        });
    }
    setupPasteHandler();
});