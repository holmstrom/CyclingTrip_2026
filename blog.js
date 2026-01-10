// Blog System with Firebase Integration
document.addEventListener('DOMContentLoaded', () => {
    const blogContainer = document.getElementById('blog-posts-container');
    const newPostBtn = document.getElementById('blog-new-post-btn');
    const createPostDiv = document.getElementById('blog-create-post');
    const createPostClose = document.getElementById('blog-create-close');
    const postText = document.getElementById('blog-post-text');
    const postImageInput = document.getElementById('blog-post-image-input');
    const postImagePreview = document.getElementById('blog-post-image-preview');
    const postImagePreviewImg = document.getElementById('blog-post-image-preview-img');
    const postImageRemove = document.getElementById('blog-post-image-remove');
    const postSubmit = document.getElementById('blog-post-submit');
    
    let currentUser = localStorage.getItem('blog_user_name') || 'Anonym';
    let currentUserInitials = localStorage.getItem('blog_user_initials') || 'A';
    let selectedImage = null;
    
    // Get user name on first use - Mobile-friendly modal instead of prompt
    function showNameModal() {
        const modal = document.createElement('div');
        modal.id = 'blog-name-modal';
        modal.style.cssText = 'position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0, 0, 0, 0.9); display: flex; justify-content: center; align-items: center; z-index: 10000; padding: 1rem;';
        
        modal.innerHTML = `
            <div style="background: var(--bg-card); padding: 2rem; border-radius: 12px; border: 1px solid rgba(255, 79, 64, 0.3); max-width: 400px; width: 100%; box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);">
                <h2 style="margin-bottom: 1rem; color: var(--text-primary);">Hvad er dit navn?</h2>
                <p class="text-secondary" style="margin-bottom: 1.5rem;">Dit navn bruges til blog posts og kommentarer</p>
                <input type="text" id="blog-name-input" placeholder="Dit navn" autocomplete="name" style="width: 100%; padding: 0.75rem 1rem; margin-bottom: 1rem; border: 1px solid rgba(255, 79, 64, 0.3); border-left: 3px solid var(--accent); border-radius: 8px; background: var(--mountain-gradient); color: var(--text-primary); font-size: 1rem; transition: all 0.2s;">
                <div style="display: flex; gap: 0.5rem;">
                    <button id="blog-name-submit" class="btn btn-primary" style="flex: 1; padding: 0.75rem;">Gem</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        const input = document.getElementById('blog-name-input');
        const submitBtn = document.getElementById('blog-name-submit');
        
        input.focus();
        
        const handleSubmit = () => {
            const userName = input.value.trim();
            if (userName) {
                currentUser = userName;
                currentUserInitials = userName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
                localStorage.setItem('blog_user_name', userName);
                localStorage.setItem('blog_user_initials', currentUserInitials);
                
                // Update create post author
                const createAvatar = document.getElementById('blog-create-avatar');
                const createAuthor = document.getElementById('blog-create-author');
                if (createAvatar) createAvatar.textContent = currentUserInitials;
                if (createAuthor) createAuthor.textContent = currentUser;
                
                document.body.removeChild(modal);
            }
        };
        
        submitBtn.addEventListener('click', handleSubmit);
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                handleSubmit();
            }
        });
    }
    
    // Show name modal on first use
    if (!localStorage.getItem('blog_user_name')) {
        // Wait a bit for page to load
        setTimeout(showNameModal, 500);
    }
    
    // Update create post author
    const createAvatar = document.getElementById('blog-create-avatar');
    const createAuthor = document.getElementById('blog-create-author');
    if (createAvatar) createAvatar.textContent = currentUserInitials;
    if (createAuthor) createAuthor.textContent = currentUser;
    
    // New Post Button
    if (newPostBtn) {
        newPostBtn.addEventListener('click', () => {
            if (createPostDiv) createPostDiv.style.display = 'block';
            createPostDiv.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
    }
    
    // Close Create Post
    if (createPostClose) {
        createPostClose.addEventListener('click', () => {
            if (createPostDiv) createPostDiv.style.display = 'none';
            postText.value = '';
            selectedImage = null;
            postImagePreview.style.display = 'none';
        });
    }
    
    // Image Upload
    if (postImageInput) {
        postImageInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (event) => {
                    selectedImage = event.target.result;
                    postImagePreviewImg.src = selectedImage;
                    postImagePreview.style.display = 'block';
                };
                reader.readAsDataURL(file);
            }
        });
    }
    
    // Remove Image
    if (postImageRemove) {
        postImageRemove.addEventListener('click', () => {
            selectedImage = null;
            postImagePreview.style.display = 'none';
            if (postImageInput) postImageInput.value = '';
        });
    }
    
    // Submit Post
    if (postSubmit) {
        postSubmit.addEventListener('click', async () => {
            const text = postText.value.trim();
            if (!text && !selectedImage) {
                alert('Indtast tekst eller tilføj et billede');
                return;
            }
            
            const post = {
                id: Date.now().toString(),
                author: currentUser,
                authorInitials: currentUserInitials,
                text: text,
                image: selectedImage,
                likes: [],
                comments: [],
                timestamp: Date.now(),
                date: new Date().toLocaleDateString('da-DK', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                })
            };
            
            // Save to Firebase if available, otherwise localStorage
            if (window.syncManager && window.syncManager.isFirebaseAvailable) {
                await saveBlogPostToFirebase(post);
            } else {
                saveBlogPostToLocalStorage(post);
            }
            
            // Clear form
            postText.value = '';
            selectedImage = null;
            postImagePreview.style.display = 'none';
            if (postImageInput) postImageInput.value = '';
            if (createPostDiv) createPostDiv.style.display = 'none';
            
            // Reload posts
            loadBlogPosts();
        });
    }
    
    // Save to Firebase
    async function saveBlogPostToFirebase(post) {
        try {
            const posts = await loadBlogPostsFromFirebase();
            posts.unshift(post); // Add to beginning
            await window.db.collection('alps-2026').doc('blog_posts').set({
                posts: posts
            });
        } catch (error) {
            console.error('Error saving blog post to Firebase:', error);
            // Fallback to localStorage
            saveBlogPostToLocalStorage(post);
        }
    }
    
    // Save to localStorage
    function saveBlogPostToLocalStorage(post) {
        const posts = JSON.parse(localStorage.getItem('blog_posts') || '[]');
        posts.unshift(post);
        localStorage.setItem('blog_posts', JSON.stringify(posts));
    }
    
    // Load from Firebase
    async function loadBlogPostsFromFirebase() {
        if (window.syncManager && window.syncManager.isFirebaseAvailable) {
            try {
                const doc = await window.db.collection('alps-2026').doc('blog_posts').get();
                if (doc.exists) {
                    return doc.data().posts || [];
                }
            } catch (error) {
                console.error('Error loading blog posts from Firebase:', error);
            }
        }
        return [];
    }
    
    // Load from localStorage
    function loadBlogPostsFromLocalStorage() {
        return JSON.parse(localStorage.getItem('blog_posts') || '[]');
    }
    
    // Load all posts
    async function loadBlogPosts() {
        let posts = [];
        
        // Try Firebase first
        if (window.syncManager && window.syncManager.isFirebaseAvailable) {
            posts = await loadBlogPostsFromFirebase();
            // Also sync to localStorage as backup
            if (posts.length > 0) {
                localStorage.setItem('blog_posts', JSON.stringify(posts));
            }
        }
        
        // If no posts from Firebase, try localStorage
        if (posts.length === 0) {
            posts = loadBlogPostsFromLocalStorage();
        }
        
        // Render posts - find container dynamically in case it wasn't ready initially
        const container = document.getElementById('blog-posts-container') || blogContainer;
        if (container) {
            if (posts.length === 0) {
                container.innerHTML = '<p class="text-secondary" style="text-align: center; padding: 2rem;">Ingen opdateringer endnu. Vær den første til at dele noget!</p>';
            } else {
                container.innerHTML = '';
                posts.forEach(post => renderBlogPost(post));
            }
        } else {
            console.warn('Blog container not found - retrying in 1 second');
            setTimeout(loadBlogPosts, 1000);
        }
    }
    
    // Render a blog post
    function renderBlogPost(post) {
        const postDiv = document.createElement('div');
        postDiv.className = 'blog-post';
        postDiv.dataset.postId = post.id;
        
        const isLiked = post.likes && post.likes.includes(currentUser);
        const likeCount = post.likes ? post.likes.length : 0;
        const commentCount = post.comments ? post.comments.length : 0;
        
        // Format text with line breaks
        const formattedText = post.text.split('\n').map(p => `<p>${p}</p>`).join('');
        
        // Show comments by default if there are any
        const showCommentsByDefault = commentCount > 0;
        
        postDiv.innerHTML = `
            <div class="blog-post-header">
                <div class="blog-author">
                    <div class="blog-avatar">${post.authorInitials || post.author.substring(0, 2).toUpperCase()}</div>
                    <div>
                        <div class="blog-author-name">${post.author}</div>
                    </div>
                </div>
                <div style="display: flex; align-items: center; gap: 1rem;">
                    <div class="blog-post-date">${post.date || new Date(post.timestamp).toLocaleDateString('da-DK')}</div>
                    <div class="blog-post-actions-menu" style="position: relative;">
                        <button class="blog-action-menu-btn" data-post-id="${post.id}" style="background: none; border: none; color: var(--text-secondary); cursor: pointer; padding: 0.5rem; border-radius: 50%;">
                            <i class="fas fa-ellipsis-h"></i>
                        </button>
                        <div class="blog-post-menu" id="menu-${post.id}" style="display: none; position: absolute; right: 0; top: 100%; background: var(--bg-card); border: 1px solid var(--border); border-radius: 8px; padding: 0.5rem; margin-top: 0.5rem; z-index: 100; min-width: 150px;">
                            <button class="blog-menu-item blog-edit-btn" data-post-id="${post.id}" style="width: 100%; text-align: left; padding: 0.5rem; background: none; border: none; color: var(--text-primary); cursor: pointer; border-radius: 4px;">
                                <i class="fas fa-edit"></i> Rediger
                            </button>
                            <button class="blog-menu-item blog-delete-btn" data-post-id="${post.id}" style="width: 100%; text-align: left; padding: 0.5rem; background: none; border: none; color: #FF4F40; cursor: pointer; border-radius: 4px;">
                                <i class="fas fa-trash"></i> Slet
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="blog-post-content" id="content-${post.id}">
                ${formattedText}
                ${post.image ? `<img src="${post.image}" style="max-width: 100%; border-radius: 8px; margin-top: 1rem; cursor: pointer;" onclick="this.style.maxWidth = this.style.maxWidth === '100%' ? 'none' : '100%'">` : ''}
            </div>
            
            <div class="blog-post-engagement">
                <div class="blog-likes">
                    ${likeCount > 0 ? `<i class="fas fa-thumbs-up" style="color: #1877F2;"></i><span>${likeCount} ${likeCount === 1 ? 'person' : 'personer'}</span>` : ''}
                </div>
                ${commentCount > 0 ? `<div class="blog-comments-count" style="cursor: pointer;" data-post-id="${post.id}">${commentCount} ${commentCount === 1 ? 'kommentar' : 'kommentarer'}</div>` : ''}
            </div>
            
            <div class="blog-post-actions">
                <button class="blog-action-btn blog-like-btn ${isLiked ? 'liked' : ''}" data-post-id="${post.id}">
                    <i class="fas fa-thumbs-up"></i> ${isLiked ? 'Synes godt om' : 'Synes godt om'}
                </button>
                <button class="blog-action-btn blog-comment-toggle-btn" data-post-id="${post.id}">
                    <i class="fas fa-comment"></i> Kommenter
                </button>
            </div>
            
            <div class="blog-comments" id="comments-${post.id}" style="display: ${showCommentsByDefault ? 'block' : 'none'};">
                ${post.comments && post.comments.length > 0 ? post.comments.map((comment, idx) => `
                    <div class="blog-comment">
                        <div class="blog-avatar">${comment.authorInitials || comment.author.substring(0, 2).toUpperCase()}</div>
                        <div class="blog-comment-content">
                            <div class="blog-comment-header">
                                <strong>${comment.author}</strong>
                                <span class="blog-comment-time">${formatTimeAgo(comment.timestamp)}</span>
                            </div>
                            <p>${comment.text}</p>
                        </div>
                    </div>
                `).join('') : ''}
                
                <div class="blog-comment-input">
                    <div class="blog-avatar">${currentUserInitials}</div>
                    <input type="text" class="blog-comment-text-input" placeholder="Skriv en kommentar..." data-post-id="${post.id}" />
                </div>
            </div>
        `;
        
        blogContainer.appendChild(postDiv);
        
        // Add event listeners
        const likeBtn = postDiv.querySelector('.blog-like-btn');
        if (likeBtn) {
            likeBtn.addEventListener('click', () => toggleLike(post.id));
        }
        
        const commentToggle = postDiv.querySelector('.blog-comment-toggle-btn');
        if (commentToggle) {
            commentToggle.addEventListener('click', () => {
                const commentsDiv = postDiv.querySelector(`#comments-${post.id}`);
                if (commentsDiv) {
                    commentsDiv.style.display = commentsDiv.style.display === 'none' ? 'block' : 'none';
                }
            });
        }
        
        const commentInput = postDiv.querySelector('.blog-comment-text-input');
        if (commentInput) {
            commentInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter' && e.target.value.trim()) {
                    addComment(post.id, e.target.value.trim());
                    e.target.value = '';
                }
            });
        }
        
        // Menu toggle
        const menuBtn = postDiv.querySelector('.blog-action-menu-btn');
        const menu = postDiv.querySelector(`#menu-${post.id}`);
        if (menuBtn && menu) {
            menuBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                // Close all other menus
                document.querySelectorAll('.blog-post-menu').forEach(m => {
                    if (m.id !== menu.id) m.style.display = 'none';
                });
                menu.style.display = menu.style.display === 'none' ? 'block' : 'none';
            });
            
            // Close menu when clicking outside
            document.addEventListener('click', (e) => {
                if (!menu.contains(e.target) && !menuBtn.contains(e.target)) {
                    menu.style.display = 'none';
                }
            });
        }
        
        // Edit button
        const editBtn = postDiv.querySelector('.blog-edit-btn');
        if (editBtn) {
            editBtn.addEventListener('click', () => editPost(post.id));
        }
        
        // Delete button
        const deleteBtn = postDiv.querySelector('.blog-delete-btn');
        if (deleteBtn) {
            deleteBtn.addEventListener('click', () => {
                if (confirm('Er du sikker på at du vil slette denne opdatering?')) {
                    deletePost(post.id);
                }
            });
        }
        
        // Comments count click to toggle
        const commentsCount = postDiv.querySelector('.blog-comments-count');
        if (commentsCount) {
            commentsCount.addEventListener('click', () => {
                const commentsDiv = postDiv.querySelector(`#comments-${post.id}`);
                if (commentsDiv) {
                    commentsDiv.style.display = commentsDiv.style.display === 'none' ? 'block' : 'none';
                }
            });
        }
    }
    
    // Edit post
    async function editPost(postId) {
        let posts = [];
        if (window.syncManager && window.syncManager.isFirebaseAvailable) {
            posts = await loadBlogPostsFromFirebase();
        } else {
            posts = loadBlogPostsFromLocalStorage();
        }
        
        const post = posts.find(p => p.id === postId);
        if (!post) return;
        
        // Show edit form
        const postDiv = document.querySelector(`[data-post-id="${postId}"]`);
        if (!postDiv) return;
        
        const contentDiv = postDiv.querySelector(`#content-${postId}`);
        if (!contentDiv) return;
        
        // Create edit form
        const editForm = document.createElement('div');
        editForm.innerHTML = `
            <textarea id="edit-text-${postId}" style="width: 100%; padding: 1rem; border: 1px solid var(--border); border-radius: 8px; background: var(--bg-dark); color: var(--text-primary); font-family: inherit; resize: vertical; min-height: 100px;">${post.text}</textarea>
            ${post.image ? `<div style="margin-top: 1rem;"><img src="${post.image}" style="max-width: 100%; border-radius: 8px; max-height: 200px;"><br><button id="remove-img-${postId}" class="btn btn-secondary" style="margin-top: 0.5rem; padding: 0.5rem 1rem;"><i class="fas fa-times"></i> Fjern Billede</button></div>` : ''}
            <div style="display: flex; gap: 0.5rem; margin-top: 1rem;">
                <button id="save-edit-${postId}" class="btn btn-primary" style="padding: 0.5rem 1.5rem;">Gem</button>
                <button id="cancel-edit-${postId}" class="btn btn-secondary" style="padding: 0.5rem 1.5rem;">Annuller</button>
            </div>
        `;
        
        const originalContent = contentDiv.innerHTML;
        contentDiv.innerHTML = '';
        contentDiv.appendChild(editForm);
        
        // Remove image
        const removeImgBtn = document.getElementById(`remove-img-${postId}`);
        if (removeImgBtn) {
            removeImgBtn.addEventListener('click', () => {
                post.image = null;
                editForm.querySelector('div').remove();
            });
        }
        
        // Save
        const saveBtn = document.getElementById(`save-edit-${postId}`);
        if (saveBtn) {
            saveBtn.addEventListener('click', async () => {
                const newText = document.getElementById(`edit-text-${postId}`).value.trim();
                if (!newText && !post.image) {
                    alert('Indtast tekst eller tilføj et billede');
                    return;
                }
                
                post.text = newText;
                post.timestamp = Date.now(); // Update timestamp
                
                // Save
                if (window.syncManager && window.syncManager.isFirebaseAvailable) {
                    await window.db.collection('alps-2026').doc('blog_posts').set({
                        posts: posts
                    });
                    localStorage.setItem('blog_posts', JSON.stringify(posts));
                } else {
                    localStorage.setItem('blog_posts', JSON.stringify(posts));
                }
                
                loadBlogPosts();
            });
        }
        
        // Cancel
        const cancelBtn = document.getElementById(`cancel-edit-${postId}`);
        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => {
                contentDiv.innerHTML = originalContent;
            });
        }
    }
    
    // Delete post
    async function deletePost(postId) {
        let posts = [];
        if (window.syncManager && window.syncManager.isFirebaseAvailable) {
            posts = await loadBlogPostsFromFirebase();
        } else {
            posts = loadBlogPostsFromLocalStorage();
        }
        
        const index = posts.findIndex(p => p.id === postId);
        if (index > -1) {
            posts.splice(index, 1);
            
            // Save
            if (window.syncManager && window.syncManager.isFirebaseAvailable) {
                await window.db.collection('alps-2026').doc('blog_posts').set({
                    posts: posts
                });
                localStorage.setItem('blog_posts', JSON.stringify(posts));
            } else {
                localStorage.setItem('blog_posts', JSON.stringify(posts));
            }
            
            loadBlogPosts();
        }
    }
    
    // Toggle like
    async function toggleLike(postId) {
        let posts = [];
        if (window.syncManager && window.syncManager.isFirebaseAvailable) {
            posts = await loadBlogPostsFromFirebase();
        } else {
            posts = loadBlogPostsFromLocalStorage();
        }
        
        const post = posts.find(p => p.id === postId);
        if (!post) return;
        
        if (!post.likes) post.likes = [];
        
        const index = post.likes.indexOf(currentUser);
        if (index > -1) {
            post.likes.splice(index, 1);
        } else {
            post.likes.push(currentUser);
        }
        
        // Save back
        if (window.syncManager && window.syncManager.isFirebaseAvailable) {
            await window.db.collection('alps-2026').doc('blog_posts').set({
                posts: posts
            });
            localStorage.setItem('blog_posts', JSON.stringify(posts));
        } else {
            localStorage.setItem('blog_posts', JSON.stringify(posts));
        }
        
        loadBlogPosts();
    }
    
    // Add comment
    async function addComment(postId, text) {
        let posts = [];
        if (window.syncManager && window.syncManager.isFirebaseAvailable) {
            posts = await loadBlogPostsFromFirebase();
        } else {
            posts = loadBlogPostsFromLocalStorage();
        }
        
        const post = posts.find(p => p.id === postId);
        if (!post) return;
        
        if (!post.comments) post.comments = [];
        
        post.comments.push({
            author: currentUser,
            authorInitials: currentUserInitials,
            text: text,
            timestamp: Date.now()
        });
        
        // Save back
        if (window.syncManager && window.syncManager.isFirebaseAvailable) {
            await window.db.collection('alps-2026').doc('blog_posts').set({
                posts: posts
            });
            localStorage.setItem('blog_posts', JSON.stringify(posts));
        } else {
            localStorage.setItem('blog_posts', JSON.stringify(posts));
        }
        
        loadBlogPosts();
    }
    
    // Format time ago
    function formatTimeAgo(timestamp) {
        const now = Date.now();
        const diff = now - timestamp;
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);
        
        if (minutes < 1) return 'Lige nu';
        if (minutes < 60) return `${minutes} ${minutes === 1 ? 'minut' : 'minutter'} siden`;
        if (hours < 24) return `${hours} ${hours === 1 ? 'time' : 'timer'} siden`;
        if (days < 7) return `${days} ${days === 1 ? 'dag' : 'dage'} siden`;
        return new Date(timestamp).toLocaleDateString('da-DK');
    }
    
    // Load posts on page load
    // Load posts after a short delay to ensure DOM is ready
    setTimeout(() => {
        loadBlogPosts();
    }, 500);
    
    // Auto-refresh every 30 seconds
    setInterval(loadBlogPosts, 30000);
});

