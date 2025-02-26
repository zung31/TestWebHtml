<?php
header('Content-Type: application/json');

require 'db.php';

$data = json_decode(file_get_contents('php://input'), true);
$categoryIds = $data['categoryIds'];
$parentId = $data['parentId'] === 'root' ? null : $data['parentId']; // 'root' cho category niveau 1

try {
    // Cập nhật thứ tự của các category
    foreach ($categoryIds as $index => $categoryId) {
        $query = "UPDATE categories SET `order` = :order WHERE id = :id AND parent_id " . ($parentId === null ? "IS NULL" : "= :parent_id");
        $stmt = $pdo->prepare($query);
        $params = [
            ':order' => $index + 1, // Thứ tự bắt đầu từ 1
            ':id' => $categoryId,
        ];
        if ($parentId !== null) {
            $params[':parent_id'] = $parentId;
        }
        $stmt->execute($params);
    }

    echo json_encode(['success' => true]);
} catch (PDOException $e) {
    echo json_encode(['success' => false, 'message' => 'Erreur lors de la mise à jour de l\'ordre: ' . $e->getMessage()]);
}
?>