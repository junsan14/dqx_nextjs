import Link from 'next/link'

export default function ToolsPage() {
    return (
        <div>
            <h1>Tools Dashboard</h1>

            <ul>
                <li><Link href="/tool-editor/equipments">装備管理</Link></li>
                <li><Link href="/tool-editor/orbs">オーブ管理</Link></li>
                <li><Link href="/tool-editor/items">アイテム管理</Link></li>
                <li><Link href="/tool-editor/accessories">アクセサリー管理</Link></li>
                <li><Link href="/tool-editor/monsters">モンスター管理</Link></li>
            </ul>
        </div>
    )
}