// ==UserScript==
// @name         (미완성) 아카라이브 게시물 백업 도구
// @namespace    https://arca.live/b/lucille
// @version      0.4
// @description  현재 보고 있는 아카라이브 게시물의 내용, 이미지, 댓글을 백업합니다
// @author       루실
// @downloadURL  https://raw.githubusercontent.com/Lucille-dolce/ArcaCollector/main/ArcaCollector.user.js
// @updateURL    https://raw.githubusercontent.com/Lucille-dolce/ArcaCollector/main/ArcaCollector.user.js
// @match        *://arca.live/*
// @grant        GM_download
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_xmlhttpRequest
// ==/UserScript==

(function() {
    'use strict';
    
    // 기본 설정 및 저장된 설정 로드
    let config = {
        saveImages: true,
        saveHTML: true,
        takeScreenshot: true,
        excludeBannerImages: true,
        saveComments: true,      // 댓글 저장 옵션 추가
        folderName: ''           // 저장 폴더명
    };
    
    // 저장된 설정 로드
    function loadConfig() {
        if (typeof GM_getValue === 'function') {
            const savedConfig = GM_getValue('backupConfig');
            if (savedConfig) {
                config = {...config, ...JSON.parse(savedConfig)};
            }
        }
    }
    
    // 설정 저장
    function saveConfig() {
        if (typeof GM_setValue === 'function') {
            GM_setValue('backupConfig', JSON.stringify(config));
        }
    }
    
    // 로드 시 설정 불러오기
    loadConfig();
    
    // 백업 컨트롤 패널 생성
    function createBackupControls() {
        // 메인 컨테이너
        const container = document.createElement('div');
        container.id = 'backup-control-panel';
        container.style.position = 'fixed';
        container.style.bottom = '30px';
        container.style.right = '30px';
        container.style.zIndex = '999999';
        container.style.display = 'flex';
        container.style.flexDirection = 'column';
        container.style.gap = '10px';
        container.style.alignItems = 'flex-end';
        
        // 설정 패널 (기본적으로 숨겨짐)
        const settingsPanel = document.createElement('div');
        settingsPanel.id = 'backup-settings-panel';
        settingsPanel.style.backgroundColor = 'rgba(40, 40, 40, 0.9)';
        settingsPanel.style.borderRadius = '8px';
        settingsPanel.style.padding = '15px';
        settingsPanel.style.boxShadow = '0 3px 10px rgba(0, 0, 0, 0.3)';
        settingsPanel.style.width = '250px';
        settingsPanel.style.display = 'none';
        
        // 설정 헤더
        const settingsHeader = document.createElement('div');
        settingsHeader.style.borderBottom = '1px solid #555';
        settingsHeader.style.marginBottom = '10px';
        settingsHeader.style.paddingBottom = '5px';
        settingsHeader.style.fontSize = '16px';
        settingsHeader.style.fontWeight = 'bold';
        settingsHeader.style.color = '#fff';
        settingsHeader.innerText = '백업 설정';
        settingsPanel.appendChild(settingsHeader);
        
        // 옵션 생성 함수
        function createOption(id, label, checked) {
            const optionContainer = document.createElement('div');
            optionContainer.style.display = 'flex';
            optionContainer.style.alignItems = 'center';
            optionContainer.style.marginBottom = '8px';
            
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.id = id;
            checkbox.checked = checked;
            checkbox.style.marginRight = '8px';
            
            const labelElem = document.createElement('label');
            labelElem.htmlFor = id;
            labelElem.innerText = label;
            labelElem.style.color = '#fff';
            labelElem.style.fontSize = '14px';
            labelElem.style.cursor = 'pointer';
            
            optionContainer.appendChild(checkbox);
            optionContainer.appendChild(labelElem);
            
            return optionContainer;
        }
        
        // 설정 옵션들 추가
        const htmlOption = createOption('save-html', 'HTML 저장', config.saveHTML);
        const imagesOption = createOption('save-images', '이미지 저장', config.saveImages);
        const screenshotOption = createOption('take-screenshot', '스크린샷 저장', config.takeScreenshot);
        const excludeBannerOption = createOption('exclude-banner', '대표 이미지 제외', config.excludeBannerImages);
        const saveCommentsOption = createOption('save-comments', '댓글 포함', config.saveComments); // 새로 추가
        
        // 옵션 이벤트 리스너
        htmlOption.querySelector('input').addEventListener('change', function() {
            config.saveHTML = this.checked;
            saveConfig();
        });
        
        imagesOption.querySelector('input').addEventListener('change', function() {
            config.saveImages = this.checked;
            saveConfig();
        });
        
        screenshotOption.querySelector('input').addEventListener('change', function() {
            config.takeScreenshot = this.checked;
            saveConfig();
        });
        
        excludeBannerOption.querySelector('input').addEventListener('change', function() {
            config.excludeBannerImages = this.checked;
            saveConfig();
        });
        
        saveCommentsOption.querySelector('input').addEventListener('change', function() {
            config.saveComments = this.checked;
            saveConfig();
        });
        
        settingsPanel.appendChild(htmlOption);
        settingsPanel.appendChild(imagesOption);
        settingsPanel.appendChild(screenshotOption);
        settingsPanel.appendChild(excludeBannerOption);
        settingsPanel.appendChild(saveCommentsOption); // 새로 추가
        
        // 폴더 설정 섹션
        const folderSection = document.createElement('div');
        folderSection.style.marginTop = '12px';
        folderSection.style.borderTop = '1px solid #555';
        folderSection.style.paddingTop = '10px';
        
        const folderLabel = document.createElement('label');
        folderLabel.innerText = '저장 폴더 이름';
        folderLabel.style.color = '#fff';
        folderLabel.style.fontSize = '14px';
        folderLabel.style.display = 'block';
        folderLabel.style.marginBottom = '5px';
        
        const folderInput = document.createElement('input');
        folderInput.type = 'text';
        folderInput.id = 'folder-name';
        folderInput.value = config.folderName || '';
        folderInput.placeholder = '기본 폴더 이름 (선택사항)';
        folderInput.style.width = '100%';
        folderInput.style.padding = '5px';
        folderInput.style.borderRadius = '4px';
        folderInput.style.border = '1px solid #777';
        folderInput.style.backgroundColor = '#333';
        folderInput.style.color = '#fff';
        folderInput.style.marginBottom = '10px';
        
        folderInput.addEventListener('change', function() {
            config.folderName = this.value.trim();
            saveConfig();
        });
        
        folderSection.appendChild(folderLabel);
        folderSection.appendChild(folderInput);
        settingsPanel.appendChild(folderSection);
        
        // 버튼 컨테이너
        const buttonsContainer = document.createElement('div');
        buttonsContainer.style.display = 'flex';
        buttonsContainer.style.gap = '10px';
        
        // 설정 버튼
        const settingsButton = document.createElement('button');
        settingsButton.innerText = '⚙️';
        settingsButton.style.width = '40px';
        settingsButton.style.height = '40px';
        settingsButton.style.borderRadius = '50%';
        settingsButton.style.border = 'none';
        settingsButton.style.backgroundColor = '#555';
        settingsButton.style.color = 'white';
        settingsButton.style.fontSize = '18px';
        settingsButton.style.cursor = 'pointer';
        settingsButton.style.boxShadow = '0 2px 5px rgba(0,0,0,0.2)';
        settingsButton.title = '백업 설정';
        
        // 설정 토글
        settingsButton.onclick = function() {
            if (settingsPanel.style.display === 'none') {
                settingsPanel.style.display = 'block';
            } else {
                settingsPanel.style.display = 'none';
            }
        };
        
        // 백업 버튼
        const backupButton = document.createElement('button');
        backupButton.innerText = '현재 페이지 백업';
        backupButton.style.padding = '10px 15px';
        backupButton.style.backgroundColor = '#3a8eff';
        backupButton.style.color = 'white';
        backupButton.style.border = 'none';
        backupButton.style.borderRadius = '8px';
        backupButton.style.cursor = 'pointer';
        backupButton.style.boxShadow = '0 2px 5px rgba(0,0,0,0.2)';
        backupButton.style.fontSize = '14px';
        
        backupButton.onclick = backupCurrentPage;
        
        buttonsContainer.appendChild(settingsButton);
        buttonsContainer.appendChild(backupButton);
        
        container.appendChild(settingsPanel);
        container.appendChild(buttonsContainer);
        document.body.appendChild(container);
        
        // ESC 키로 설정 패널 닫기
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape' && settingsPanel.style.display === 'block') {
                settingsPanel.style.display = 'none';
            }
        });
        
        // 패널 외부 클릭 시 닫기
        document.addEventListener('click', function(e) {
            if (settingsPanel.style.display === 'block' && 
                !container.contains(e.target)) {
                settingsPanel.style.display = 'none';
            }
        });
    }
    
    // 현재 페이지 백업
    async function backupCurrentPage() {
        showToast('백업 시작...');
        
        // 폴더명 생성 (사용자 지정 또는 자동)
        let folderName = config.folderName || '';
        if (!folderName) {
            const timestamp = new Date().toISOString().replace(/:/g, '-').split('.')[0];
            const pageTitle = getPageTitle();
            folderName = `${pageTitle}_${timestamp}`;
        }
        
        // 데이터 추출 (비동기 처리로 변경)
        const content = await extractContent();
        
        // HTML 저장
        if (config.saveHTML) {
            saveTextAsFile(content.html, `${folderName}_content.html`);
        }
        
        // 이미지 다운로드
        if (config.saveImages) {
            await downloadImages(content.images, folderName);
        }
        
        // 스크린샷 (html2canvas 필요)
        if (config.takeScreenshot && typeof html2canvas !== 'undefined') {
            takeScreenshot(folderName);
        }
        
        showToast('백업 완료!');
    }
    
    // 컨텐츠 추출 (비동기 함수로 변경)
    async function extractContent() {
        // 본문 추출 (기존 코드)
        const articleBody = document.querySelector('.article-body');
        const title = getPageTitle();
        const images = getArticleImages();
        
        // 댓글 추출 (새로 추가)
        let comments = [];
        if (config.saveComments) {
            showToast('댓글 추출 중...');
            const currentUrl = window.location.href;
            comments = await getAllComments(currentUrl);
            showToast(`총 ${comments.length}개 댓글 추출 완료`);
        }
        
        // 댓글 HTML 구성
        const commentsHtml = config.saveComments ? buildCommentsHtml(comments) : '';
        
        // HTML 형식 텍스트
        const htmlContent = `
            <html>
            <head>
                <title>${title}</title>
                <meta charset="utf-8">
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; max-width: 1200px; margin: 0 auto; padding: 20px; }
                    img { max-width: 100%; }
                    .content { margin-bottom: 30px; }
                    .comments-section { margin-top: 30px; border-top: 1px solid #ddd; padding-top: 20px; }
                    .comment { margin-bottom: 15px; padding: 10px; border: 1px solid #eee; border-radius: 5px; }
                    .comment-reply { margin-left: 40px; border-left: 3px solid #3a8eff; background-color: #f9f9f9; }
                    .comment-header { display: flex; justify-content: space-between; margin-bottom: 5px; }
                    .comment-author { font-weight: bold; }
                    .comment-time { color: #666; font-size: 0.9em; }
                    .comment-content { margin-top: 5px; }
                </style>
            </head>
            <body>
                <h1>${title}</h1>
                <div class="content">
                    ${articleBody ? articleBody.innerHTML : '본문을 찾을 수 없습니다.'}
                </div>
                ${commentsHtml ? `
                <div class="comments-section">
                    <h2>댓글 (${comments.length}개)</h2>
                    ${commentsHtml}
                </div>
                ` : ''}
            </body>
            </html>
        `;
        
        return {
            title: title,
            html: htmlContent,
            images: images.map(img => img.src),
            comments: comments // 댓글 데이터도 반환
        };
    }
    
    // 문서 내 이미지 가져오기 (대표 이미지 필터링)
    function getArticleImages() {
        const container = document.querySelector('.article-body') || document.body;
        return [...container.querySelectorAll('img')].filter(img => {
            // 위젯 내부의 이미지 제외
            if (img.closest('#image-float-widget') || img.closest('#backup-control-panel')) return false;
            
            // 대표 이미지 필터링: defaultImage 내부 이미지 제외
            if (config.excludeBannerImages && img.closest('#defaultImage')) return false;
            
            // 대표 이미지 필터링: 600x400 크기의 이미지 제외
            if (config.excludeBannerImages && img.width === 600 && img.height === 400) return false;
            
            // 이미지 최소 크기 조건
            const width = img.naturalWidth || img.width;
            const height = img.naturalHeight || img.height;
            return width >= 256 && height >= 256;
        });
    }
    
    // 페이지 제목 추출
    function getPageTitle() {
        try {
            const titleElement = document.querySelector('div.article-head > div.title-row > div.title');
            if (titleElement && titleElement.innerText.trim()) {
                return titleElement.innerText.trim();
            }
        } catch (error) {
            console.error('제목 추출 오류:', error);
        }
        return document.title || 'Backup_' + new Date().toISOString();
    }
    
    // 이미지 다운로드
    async function downloadImages(imageUrls, folderName) {
        // 중복 URL 제거 (동일한 이미지는 한 번만 다운로드)
        const uniqueUrls = [...new Set(imageUrls)];
        
        showToast(`이미지 다운로드 준비: 총 ${uniqueUrls.length}개`);
        
        for (let i = 0; i < uniqueUrls.length; i++) {
            const url = uniqueUrls[i];
            const filename = `${folderName}_image_${i+1}.jpg`;
            
            try {
                // Tampermonkey의 GM_download 사용
                if (typeof GM_download !== 'undefined') {
                    GM_download({
                        url: url,
                        name: filename,
                        saveAs: false  // 폴더명 지정
                    });
                } else {
                    // 일반 방식으로 다운로드
                    const link = document.createElement('a');
                    link.href = url;
                    link.download = filename;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                }
                
                // 서버 부하 방지를 위한 딜레이
                await new Promise(resolve => setTimeout(resolve, 500));
                
                showToast(`이미지 다운로드 중... (${i+1}/${uniqueUrls.length})`);
            } catch (error) {
                console.error('이미지 다운로드 오류:', error);
            }
        }
    }
    
    // 텍스트 파일 저장
    function saveTextAsFile(text, filename) {
        const blob = new Blob([text], { type: 'text/html;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        link.style.display = 'none';
        
        document.body.appendChild(link);
        link.click();
        
        setTimeout(() => {
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        }, 100);
    }
    
    // 스크린샷 촬영 (html2canvas 필요)
    function takeScreenshot(folderName) {
        try {
            const article = document.querySelector('.article-content') || document.body;
            
            html2canvas(article).then(canvas => {
                const imgData = canvas.toDataURL('image/png');
                const link = document.createElement('a');
                link.href = imgData;
                link.download = `${folderName}_screenshot.png`;
                link.click();
            });
        } catch (error) {
            console.error('스크린샷 오류:', error);
            showToast('스크린샷 생성 실패');
        }
    }
    
    // 토스트 알림
    function showToast(message) {
        let toast = document.getElementById('backup-toast');
        
        if (!toast) {
            toast = document.createElement('div');
            toast.id = 'backup-toast';
            toast.style.position = 'fixed';
            toast.style.bottom = '20px';
            toast.style.left = '50%';
            toast.style.transform = 'translateX(-50%)';
            toast.style.backgroundColor = 'rgba(0,0,0,0.8)';
            toast.style.color = '#fff';
            toast.style.padding = '10px 20px';
            toast.style.borderRadius = '5px';
            toast.style.zIndex = '1000000';
            document.body.appendChild(toast);
        }
        
        toast.innerText = message;
        toast.style.display = 'block';
        
        // 이전 타이머 취소
        if (toast.timeoutId) clearTimeout(toast.timeoutId);
        
        // 3초 후 사라짐
        toast.timeoutId = setTimeout(() => {
            toast.style.display = 'none';
        }, 3000);
    }
    
    // html2canvas 라이브러리 로드 (필요시)
    function loadHtml2Canvas() {
        if (typeof html2canvas === 'undefined' && config.takeScreenshot) {
            const script = document.createElement('script');
            script.src = 'https://html2canvas.hertzen.com/dist/html2canvas.min.js';
            document.head.appendChild(script);
        }
    }
    
    // 초기화
    function init() {
        setTimeout(() => {
            createBackupControls();
            loadHtml2Canvas();
        }, 1000); // 페이지 로드 후 1초 후 초기화
    }
    
    // ----- 댓글 관련 새로운 함수들 -----
    
    // 모든 댓글 페이지를 처리하여 댓글 추출
    async function getAllComments(articleUrl) {
        try {
            // 1. 총 댓글 페이지 수 확인
            const totalPages = await getCommentPageCount(articleUrl);
            
            let allComments = [];
            
            // 2. 모든 페이지 순회하며 댓글 수집
            for (let page = 1; page <= totalPages; page++) {
                showToast(`댓글 페이지 ${page}/${totalPages} 처리 중...`);
                const commentsFromPage = await fetchCommentsFromPage(articleUrl, page);
                allComments = allComments.concat(commentsFromPage);
                
                // 서버 부하 방지를 위한 딜레이
                if (page < totalPages) {
                    await new Promise(resolve => setTimeout(resolve, 300));
                }
            }
            
            return allComments;
        } catch (error) {
            console.error('댓글 추출 오류:', error);
            showToast('댓글 추출 중 오류가 발생했습니다');
            return [];
        }
    }
    
    // 총 댓글 페이지 수 가져오기
    async function getCommentPageCount(articleUrl) {
        try {
            const response = await fetchWithTimeout(articleUrl);
            const html = await response.text();
            
            // DOM 파싱
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');
            
            // 페이지네이션 링크 확인
            const paginationLinks = doc.querySelectorAll('.pagination-wrapper .pagination .page-item .page-link');
            
            if (paginationLinks.length === 0) {
                return 1; // 페이지네이션이 없으면 1페이지만 있는 것
            }
            
            // 마지막 페이지 번호 찾기
            let maxPage = 1;
            paginationLinks.forEach(link => {
                const pageMatch = link.getAttribute('href').match(/cp=(\d+)/);
                if (pageMatch && pageMatch[1]) {
                    const pageNum = parseInt(pageMatch[1]);
                    if (pageNum > maxPage) maxPage = pageNum;
                }
            });
            
            return maxPage;
        } catch (error) {
            console.error('댓글 페이지 수 확인 오류:', error);
            return 1; // 오류 시 기본값 1
        }
    }
    
    // 특정 페이지의 댓글 가져오기
    async function fetchCommentsFromPage(articleUrl, commentPage) {
        try {
            // URL에 댓글 페이지 파라미터 추가
            const url = new URL(articleUrl);
            url.searchParams.set('cp', commentPage);
            url.hash = 'comment';
            
            // 페이지 가져오기
            const response = await fetchWithTimeout(url.toString());
            const html = await response.text();
            
            // DOM 파싱
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');
            
            // 댓글 추출
            const comments = [];
            const commentItems = doc.querySelectorAll('.list-area .comment-wrapper .comment-item');
            
            commentItems.forEach(comment => {
                try {
                    // 댓글 ID
                    const commentId = comment.id;
                    
                    // 작성자 정보
                    const authorElement = comment.querySelector('.info-row .user-info');
                    const author = authorElement ? authorElement.textContent.trim() : '익명';
                    
                    // 작성 시간
                    const timeElement = comment.querySelector('.info-row time');
                    const timeStamp = timeElement ? timeElement.getAttribute('datetime') : '';
                    const formattedTime = timeElement ? timeElement.textContent.trim() : '';
                    
                    // 댓글 내용
                    const messageElement = comment.querySelector('.message .text pre');
                    const content = messageElement ? messageElement.innerHTML : ''; // innerHTML로 변경하여 링크 등 보존
                    
                    // 이모티콘 처리
                    const emoticonElement = comment.querySelector('.message .emoticon-wrapper img');
                    const hasEmoticon = !!emoticonElement;
                    const emoticonSrc = hasEmoticon ? emoticonElement.getAttribute('src') : '';
                    
                    // 답글 여부 확인 (parentNode.parentNode를 이용하여 더 정확하게 탐색)
                    const isReply = !!comment.closest('.comment-wrapper .comment-wrapper');
                    const parentItem = isReply ? 
                        comment.closest('.comment-wrapper').parentNode.querySelector('.comment-item') : null;
                    const parentCommentId = parentItem ? parentItem.id : null;
                    
                    // 댓글 객체 생성
                    comments.push({
                        id: commentId,
                        author: author,
                        timestamp: timeStamp,
                        formattedTime: formattedTime,
                        content: content,
                        hasEmoticon: hasEmoticon,
                        emoticonSrc: emoticonSrc,
                        isReply: isReply,
                        parentCommentId: parentCommentId,
                        html: comment.outerHTML
                    });
                } catch (err) {
                    console.error('댓글 파싱 오류:', err);
                }
            });
            
            return comments;
        } catch (error) {
            console.error('댓글 페이지 가져오기 오류:', error);
            return [];
        }
    }
    
    // 댓글 HTML 구성
    function buildCommentsHtml(comments) {
        if (!comments || comments.length === 0) return '';
        
        // 댓글 트리 구조 생성 (부모 댓글과 자식 댓글)
        const commentTree = {};
        const rootComments = [];
        
        // 먼저 모든 댓글을 맵으로 구성
        comments.forEach(comment => {
            if (!comment.isReply) {
                rootComments.push(comment);
            } else if (comment.parentCommentId) {
                if (!commentTree[comment.parentCommentId]) {
                    commentTree[comment.parentCommentId] = [];
                }
                commentTree[comment.parentCommentId].push(comment);
            } else {
                // 부모를 찾을 수 없는 답글은 루트로 처리
                rootComments.push(comment);
            }
        });
        
        let html = '';
        
        // 루트 댓글 순회하며 HTML 생성
        rootComments.forEach(comment => {
            html += buildCommentHtml(comment, false);
            
            // 이 댓글에 대한 답글들 처리
            const replies = commentTree[comment.id] || [];
            replies.forEach(reply => {
                html += buildCommentHtml(reply, true);
            });
        });
        
        return html;
    }
    
    // 개별 댓글 HTML 생성
    function buildCommentHtml(comment, isReply) {
        return `
            <div class="comment ${isReply ? 'comment-reply' : ''}" id="${comment.id}">
                <div class="comment-header">
                    <span class="comment-author">${comment.author}</span>
                    <span class="comment-time">${comment.formattedTime}</span>
                </div>
                <div class="comment-content">
                    ${comment.hasEmoticon ? 
                        `<img src="${comment.emoticonSrc}" alt="이모티콘" style="max-width: 100px; max-height: 100px;">` :
                        comment.content
                    }
                </div>
            </div>
        `;
    }
    
    // 타임아웃 기능이 있는 fetch
    async function fetchWithTimeout(url, options = {}, timeout = 10000) {
        const controller = new AbortController();
        const id = setTimeout(() => controller.abort(), timeout);
        
        try {
            const response = await fetch(url, {
                ...options,
                signal: controller.signal
            });
            clearTimeout(id);
            return response;
        } catch (error) {
            clearTimeout(id);
            if (error.name === 'AbortError') {
                throw new Error('요청 시간 초과');
            }
            throw error;
        }
    }
    
    // 시작
    init();
})();
